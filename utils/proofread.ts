export async function proofreadSelection(tabId: number) {
  const response = await browser.tabs.sendMessage(tabId, { action: 'get-selection' });

  if (!response?.selectedText || response.selectedText.trim().length === 0) {
    await browser.tabs.sendMessage(tabId, {
      action: 'proofread-error',
      error: 'Please select some text to proofread',
    });
    return;
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://transcription-api-omega.vercel.app';
  const API_KEY = import.meta.env.VITE_API_KEY;

  if (!API_KEY) {
    throw new Error('API key is missing. Please set VITE_API_KEY in your .env file.');
  }

  const apiResponse = await fetch(`${API_BASE_URL}/api/proofread`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ text: response.selectedText }),
  });

  if (!apiResponse.ok) {
    throw new Error(`API returned status: ${apiResponse.status}`);
  }

  const result = await apiResponse.json();
  const proofreadText = result.proofreadText;

  if (!proofreadText) {
    throw new Error('No proofread text returned from API');
  }

  await browser.tabs.sendMessage(tabId, {
    action: 'proofread-complete',
    proofreadText,
  });
}
