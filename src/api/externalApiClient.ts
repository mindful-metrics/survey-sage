export type SubmitAnswers = Record<string, string | number>

export async function submitFormData(
  taskId: string,
  answers: SubmitAnswers,
): Promise<{ status: 'success' | 'failure' }> {
  if (!taskId || Object.keys(answers).length === 0) {
    return { status: 'failure' }
  }

  const formData = new FormData()
  formData.append('taskId', taskId)

  for (const [question, answer] of Object.entries(answers)) {
    formData.append(question, String(answer))
  }

  try {
    const response = await fetch(`/tasks/${taskId}/`, {
      method: 'POST',
      body: formData,
    })

    return (await response.json()) as { status: 'success' | 'failure' }
  } catch {
    return { status: 'failure' }
  }
}