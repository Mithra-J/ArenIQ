async function sendNotification({
  topic = process.env.NTFY_TOPIC || "areniq-alerts",
  title,
  message,
  priority = "default",
}) {
  const response = await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      Title: title,
      Priority: priority,
      Tags: "warning,water,government",
      "Content-Type": "text/plain",
    },
    body: message,
  });

  if (!response.ok) {
    throw new Error(`ntfy.sh notification failed with status ${response.status}`);
  }

  return true;
}

module.exports = {
  sendNotification,
};
