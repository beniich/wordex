/**
 * Webhook Payload Templates
 * Standardized data structures for outgoing event notifications.
 * Ensures consistent data delivery across all external integrations.
 */

export const webhookPayloadTemplates = {
  /**
   * Triggered when a new document is successfully persisted in the atelier.
   */
  documentCreated: (data: { id: string; title: string; author: string; workspaceId: string }) => ({
    event: "document.created",
    timestamp: new Date().toISOString(),
    version: "1.0",
    data: {
      document_id: data.id,
      title: data.title,
      created_by: data.author,
      workspace_id: data.workspaceId,
      url: `/workspace/${data.workspaceId}/doc/${data.id}`
    }
  }),
  
  /**
   * Triggered when an AI-driven or human comment is added.
   */
  commentAdded: (data: { id: string; documentId: string; author: string; content: string }) => ({
    event: "comment.added",
    timestamp: new Date().toISOString(),
    version: "1.0",
    data: {
      comment_id: data.id,
      document_id: data.documentId,
      author: data.author,
      snippet: data.content.length > 100 ? `${data.content.substring(0, 100)}...` : data.content
    }
  }),

  /**
   * Triggered on successful document export completion.
   */
  exportCompleted: (data: { documentId: string; format: string; downloadUrl: string }) => ({
    event: "export.completed",
    timestamp: new Date().toISOString(),
    version: "1.0",
    data: {
      document_id: data.documentId,
      format: data.format,
      download_url: data.downloadUrl
    }
  })
};
