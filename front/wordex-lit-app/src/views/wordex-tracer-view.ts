import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

// ... (shaders stay the same)

// ─── GLSL Shaders ────────────────────────────────────────────────────────────
const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_cam;
uniform vec3 u_target;
uniform vec4 u_s0; uniform vec4 u_s1; uniform vec4 u_s2; uniform vec4 u_s3;
uniform vec4 u_c0; uniform vec4 u_c1; uniform vec4 u_c2; uniform vec4 u_c3;
uniform vec2 u_m0; uniform vec2 u_m1; uniform vec2 u_m2; uniform vec2 u_m3;
uniform vec3 u_light;
uniform float u_lightStr;
uniform vec3 u_skyTop; uniform vec3 u_skyBot;
uniform vec3 u_floor1; uniform vec3 u_floor2;

#define MAX_BOUNCES 4

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}

struct Ray { vec3 o; vec3 d; };
struct Hit { float t; vec3 n; int id; bool floor; };

Hit hitSphere(Ray r, vec4 s, int id) {
  vec3 oc = r.o - s.xyz;
  float b = dot(oc, r.d);
  float c = dot(oc,oc) - s.w*s.w;
  float disc = b*b - c;
  if (disc < 0.0) return Hit(-1.0, vec3(0), id, false);
  float t = -b - sqrt(disc);
  if (t < 0.001) t = -b + sqrt(disc);
  if (t < 0.001) return Hit(-1.0, vec3(0), id, false);
  vec3 n = normalize(r.o + r.d*t - s.xyz);
  return Hit(t, n, id, false);
}

Hit scene(Ray r) {
  Hit best = Hit(1e9, vec3(0), -1, false);
  Hit h;
  h = hitSphere(r, u_s0, 0); if (h.t > 0.0 && h.t < best.t) best = h;
  h = hitSphere(r, u_s1, 1); if (h.t > 0.0 && h.t < best.t) best = h;
  h = hitSphere(r, u_s2, 2); if (h.t > 0.0 && h.t < best.t) best = h;
  h = hitSphere(r, u_s3, 3); if (h.t > 0.0 && h.t < best.t) best = h;
  if (abs(r.d.y) > 0.001) {
    float t = (-1.0 - r.o.y) / r.d.y;
    if (t > 0.001 && t < best.t) best = Hit(t, vec3(0,1,0), -1, true);
  }
  return best;
}

vec3 getMat(int id, vec3 pos, out float metal, out float rough, out float emit) {
  vec4 c; vec2 m;
  if (id == 0) { c = u_c0; m = u_m0; }
  else if (id == 1) { c = u_c1; m = u_m1; }
  else if (id == 2) { c = u_c2; m = u_m2; }
  else { c = u_c3; m = u_m3; }
  metal = c.w; rough = m.x; emit = m.y;
  return c.rgb;
}

vec3 sky(vec3 d) {
  float t = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  return mix(u_skyBot, u_skyTop, t);
}

vec3 trace(Ray ray) {
  vec3 col = vec3(0); vec3 att = vec3(1);
  for (int b = 0; b < MAX_BOUNCES; b++) {
    Hit h = scene(ray);
    if (h.t >= 1e8) { col += att * sky(ray.d); break; }
    vec3 pos = ray.o + ray.d * h.t;
    vec3 norm = h.n;
    float metal, rough, emit;
    vec3 albedo;
    if (h.floor) {
      float chk = mod(floor(pos.x * 1.2) + floor(pos.z * 1.2), 2.0);
      albedo = mix(u_floor1, u_floor2, chk);
      metal = 0.0; rough = 0.9; emit = 0.0;
    } else {
      albedo = getMat(h.id, pos, metal, rough, emit);
    }
    if (emit > 0.0) { col += att * albedo * emit * 3.0; break; }
    vec3 ldir = normalize(u_light);
    float diff = max(dot(norm, ldir), 0.0);
    float spec = pow(max(dot(reflect(-ldir, norm), -ray.d), 0.0), mix(4.0, 64.0, 1.0-rough));
    col += att * (albedo * (diff * u_lightStr + 0.1) + vec3(spec * (1.0-rough) * u_lightStr));
    att *= mix(albedo, vec3(spec), metal) * (1.0 - rough * 0.5);
    ray = Ray(pos + norm*0.002, normalize(reflect(ray.d, norm)));
    if (dot(att, att) < 0.01) break;
  }
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res*0.5) / u_res.y;
  vec3 forward = normalize(u_target - u_cam);
  vec3 right = normalize(cross(forward, vec3(0,1,0)));
  vec3 up = cross(right, forward);
  vec3 dir = normalize(forward + uv.x*right + uv.y*up);
  vec3 col = trace(Ray(u_cam, dir));
  col = col * (col*2.51+0.03) / (col*(col*2.43+0.59)+0.14);
  gl_FragColor = vec4(pow(clamp(col,0.,1.), vec3(0.4545)), 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src); gl.compileShader(s);
  return s;
}

const DEFAULT_SCENE = {
  name: "Aether Core",
  camera: [0, 1.5, 5],
  target: [0, 0, 0],
  light: [0.8, 1.2, 0.6],
  lightStr: 1.4,
  skyTop: [0.05, 0.08, 0.12],
  skyBot: [0.1, 0.12, 0.18],
  floor1: [0.15, 0.15, 0.15],
  floor2: [0.2, 0.2, 0.2],
  spheres: [
    { pos: [-1.6, 0, -0.5], r: 0.9, color: [0.89, 0.45, 0.1], metal: 0.8, rough: 0.1, emit: 0 },
    { pos: [0, 0, -1],      r: 0.9, color: [0.9, 0.9, 0.9],  metal: 1.0, rough: 0.02, emit: 0 },
    { pos: [1.6, 0, -0.5],  r: 0.9, color: [0.15, 0.6, 0.9], metal: 0.0, rough: 0.15, emit: 0 },
    { pos: [0, 0, 1.2],     r: 0.9, color: [0.3, 0.9, 0.6], metal: 0.0, rough: 0.0,  emit: 1 },
  ],
};

@customElement('wordex-tracer-view')
export class WordexTracerView extends LitElement {
  @query('canvas') private canvas!: HTMLCanvasElement;
  @state() private scene = DEFAULT_SCENE;
  @state() private rotate = true;
  @state() private prompt = "";
  
  private gl?: WebGLRenderingContext;
  private prog?: WebGLProgram;
  private animId?: number;
  private time = 0;

  static styles = css`
    :host { display: flex; flex-direction: column; height: 100%; color: #c9d1d9; font-family: 'IBM Plex Mono', monospace; background: #08090d; overflow: hidden; }
    .container { display: flex; flex: 1; overflow: hidden; }
    .visualizer { flex: 1; position: relative; background: #000; }
    canvas { width: 100%; height: 100%; display: block; }
    .hud { position: absolute; top: 20px; left: 20px; font-size: 10px; color: rgba(255,255,255,0.4); pointer-events: none; }
    .sidebar { width: 320px; border-left: 1px solid rgba(255,255,255,0.05); background: rgba(13, 15, 20, 0.8); backdrop-filter: blur(20px); padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    h2 { font-size: 14px; letter-spacing: 0.1em; color: #4fd1c5; margin: 0 0 12px 0; font-weight: 800; text-transform: uppercase; }
    textarea { width: 100%; background: #0d1015; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; padding: 12px; font-family: inherit; font-size: 12px; resize: none; outline: none; transition: border 0.3s; }
    textarea:focus { border-color: #4fd1c5; }
    .btn { background: #4fd1c5; color: #08090d; border: none; padding: 12px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.3s; font-size: 12px; text-transform: uppercase; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(79, 209, 197, 0.2); }
    .sphere-card { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .sphere-color { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
  `;

  firstUpdated() {
    this.initGL();
    this.startLoop();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  private initGL() {
    this.gl = this.canvas.getContext('webgl')!;
    const vs = createShader(this.gl, this.gl.VERTEX_SHADER, VERT_SRC);
    const fs = createShader(this.gl, this.gl.FRAGMENT_SHADER, FRAG_SRC);
    this.prog = this.gl.createProgram()!;
    this.gl.attachShader(this.prog, vs);
    this.gl.attachShader(this.prog, fs);
    this.gl.linkProgram(this.prog);

    const buf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), this.gl.STATIC_DRAW);
    const loc = this.gl.getAttribLocation(this.prog, "a_pos");
    this.gl.enableVertexAttribArray(loc);
    this.gl.vertexAttribPointer(loc, 2, this.gl.FLOAT, false, 0, 0);
  }

  private startLoop() {
    const loop = () => {
      this.time += 0.01;
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  private draw() {
    if (!this.gl || !this.prog) return;
    const gl = this.gl;
    const p = this.prog;
    
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(p);

    const u = (n: string) => gl.getUniformLocation(p, n);
    gl.uniform2f(u("u_res"), this.canvas.width, this.canvas.height);
    gl.uniform1f(u("u_time"), this.time);

    const angle = this.rotate ? this.time * 0.4 : 0;
    const [cx, cy, cz] = this.scene.camera;
    const rad = Math.sqrt(cx*cx + cz*cz);
    const cam = [Math.sin(angle)*rad, cy, Math.cos(angle)*rad];

    gl.uniform3f(u("u_cam"), cam[0], cam[1], cam[2]);
    gl.uniform3f(u("u_target"), (this.scene.target as any)[0], (this.scene.target as any)[1], (this.scene.target as any)[2]);
    gl.uniform3f(u("u_light"), (this.scene.light as any)[0], (this.scene.light as any)[1], (this.scene.light as any)[2]);
    gl.uniform1f(u("u_lightStr"), this.scene.lightStr);
    gl.uniform3f(u("u_skyTop"), (this.scene.skyTop as any)[0], (this.scene.skyTop as any)[1], (this.scene.skyTop as any)[2]);
    gl.uniform3f(u("u_skyBot"), (this.scene.skyBot as any)[0], (this.scene.skyBot as any)[1], (this.scene.skyBot as any)[2]);
    gl.uniform3f(u("u_floor1"), (this.scene.floor1 as any)[0], (this.scene.floor1 as any)[1], (this.scene.floor1 as any)[2]);
    gl.uniform3f(u("u_floor2"), (this.scene.floor2 as any)[0], (this.scene.floor2 as any)[1], (this.scene.floor2 as any)[2]);

    this.scene.spheres.forEach((s, i) => {
      gl.uniform4f(u(`u_s${i}`), s.pos[0], s.pos[1], s.pos[2], s.r);
      gl.uniform4f(u(`u_c${i}`), s.color[0], s.color[1], s.color[2], s.metal);
      gl.uniform2f(u(`u_m${i}`), s.rough, s.emit);
    });

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  render() {
    return html`
      <div class="container">
        <div class="visualizer">
          <canvas></canvas>
          <div class="hud">
            <div>CORE: ${this.scene.name.toUpperCase()}</div>
            <div>STATUS: NEURAL RENDERING ACTIVE</div>
            <div>ENGINE: RAYTRACER_V2</div>
          </div>
        </div>
        
        <div class="sidebar">
          <div>
            <h2>Neural Generator</h2>
            <textarea 
              rows="4" 
              placeholder="Décrivez une vision..." 
              .value=${this.prompt}
              @input=${(e: any) => this.prompt = e.target.value}
            ></textarea>
            <button class="btn" style="width: 100%; margin-top: 12px;">Générer</button>
          </div>

          <div>
            <h2>Entities</h2>
            ${this.scene.spheres.map((s, i) => html`
              <div class="sphere-card" style="margin-bottom: 8px;">
                <span class="sphere-color" style="background: rgb(${s.color.map(v=>Math.round(v*255)).join(',')})"></span>
                <span style="font-size: 11px; opacity: 0.8">Element.${i} [${s.metal ? 'MET' : 'DIE'}]</span>
              </div>
            `)}
          </div>
          
          <button class="btn" style="background: transparent; border: 1px solid #4fd1c5; color: #4fd1c5; margin-top: auto;" @click=${() => this.rotate = !this.rotate}>
            Toggle Orbit: ${this.rotate ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    `;
  }
}
