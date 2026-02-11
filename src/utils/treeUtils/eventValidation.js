/**
 * Validates an array of events to ensure they meet the following rules:
 * - A birth event must exist if events are provided.
 * - The birth event must have the earliest date among all events.
 * - No event can have a date earlier than the birth date.
 * @param {Array} events - Array of event objects, each with type, date, etc.
 * @throws {Error} If validation fails, with a descriptive message.
 */
export function validateEventsArray(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return; // No events to validate
  }

  // Find the birth event
  const birthEvent = events.find(event => event.type === 'birth');

  if (!birthEvent) {
    throw new Error("A birth event is required when providing custom events.");
  }

  if (!birthEvent.date) {
    throw new Error("Birth event must have a date.");
  }

  const birthDateTime = new Date(birthEvent.date).getTime();

  // Check that birth is the earliest
  for (const event of events) {
    if (event.type !== 'birth' && event.date) {
      const eventDateTime = new Date(event.date).getTime();
      if (eventDateTime < birthDateTime) {
        throw new Error(`Event "${event.title || event.type}" date (${event.date}) cannot be earlier than the birth date (${birthEvent.date}).`);
      }
    }
  }

  // Ensure no other events are before birth (already covered above, but explicit)
  // Additional check: ensure birth is indeed the earliest
  const allDatedEvents = events.filter(event => event.date);
  const sortedEvents = allDatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (sortedEvents.length > 0 && sortedEvents[0].type !== 'birth') {
    throw new Error("The birth event must be the earliest event.");
  }
}
