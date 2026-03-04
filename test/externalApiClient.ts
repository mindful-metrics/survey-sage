export async function submitFormData(taskId: string, answers: Record<string, number>) {
  const formData = new FormData()
  formData.append('taskId', taskId)

  for (const [question, answer] of Object.entries(answers)) {
    formData.append(question, String(answer))
  }

  const response = await fetch(`/tasks/${taskId}/`, {
    method: 'POST',
    body: formData,
  })

  const result = (await response.json()) as { status: 'success' | 'failure' }

  return result
}
