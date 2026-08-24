const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("../services/calendarService");

const createEvent = async (req, res) => {
  try {
    const event = await createCalendarEvent(req.body);

    return res.status(201).json({
      message: "Calendar event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create calendar event error:", error);

    return res.status(500).json({
      message: "Unable to create calendar event",
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await updateCalendarEvent({
      ...req.body,
      eventId: req.params.eventId,
    });

    return res.status(200).json({
      message: "Calendar event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update calendar event error:", error);

    return res.status(500).json({
      message: "Unable to update calendar event",
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await deleteCalendarEvent({
      ...req.body,
      eventId: req.params.eventId,
    });

    return res.status(200).json({
      message: "Calendar event deleted successfully",
      event,
    });
  } catch (error) {
    console.error("Delete calendar event error:", error);

    return res.status(500).json({
      message: "Unable to delete calendar event",
    });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
};