export async function submitFormData(taskId: string, answers: Record<string, string>) {
  const formData = new FormData()
  formData.append('taskId', taskId)

  for (const [question, answer] of Object.entries(answers)) {
    formData.append(question, answer)
  }

  console.log(formData)

  const response = await fetch(`/tasks/${taskId}/`, {
    method: 'POST',
    body: formData,
  })

  const result = (await response.json()) as { status: 'success' | 'failure' }

  return result
}
