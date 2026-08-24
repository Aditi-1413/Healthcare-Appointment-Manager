const { google } = require("googleapis");

const createOAuthClient = () => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    return null;
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};


/*
The application can generate the OAuth URL.
Actual user authorization/token storage should be implemented
before production deployment.
*/

const getAuthorizationUrl = (state) => {
  const client = createOAuthClient();

  if (!client) {
    throw new Error("Google Calendar configuration is missing.");
  }

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
    ],
    state,
  });
};


const createCalendarEvent = async ({
  accessToken,
  refreshToken,
  summary,
  description,
  startTime,
  endTime,
  attendees = [],
}) => {
  try {
    const auth = createOAuthClient();

    if (!auth) {
      return {
        success: false,
        error: "Google Calendar is not configured",
      };
    }

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({
      version: "v3",
      auth,
    });

    const event = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all",
      requestBody: {
        summary,
        description,
        start: {
          dateTime: new Date(startTime).toISOString(),
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
        },
        attendees: attendees
          .filter(Boolean)
          .map((email) => ({
            email,
          })),
      },
    });

    return {
      success: true,
      eventId: event.data.id,
      htmlLink: event.data.htmlLink,
    };
  } catch (error) {
    console.error("Google Calendar create error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};


const updateCalendarEvent = async ({
  accessToken,
  refreshToken,
  eventId,
  summary,
  description,
  startTime,
  endTime,
}) => {
  try {
    const auth = createOAuthClient();

    if (!auth) {
      return {
        success: false,
        error: "Google Calendar is not configured",
      };
    }

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({
      version: "v3",
      auth,
    });

    const event = await calendar.events.update({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
      requestBody: {
        summary,
        description,
        start: {
          dateTime: new Date(startTime).toISOString(),
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
        },
      },
    });

    return {
      success: true,
      eventId: event.data.id,
    };
  } catch (error) {
    console.error("Google Calendar update error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};


const deleteCalendarEvent = async ({
  accessToken,
  refreshToken,
  eventId,
}) => {
  try {
    const auth = createOAuthClient();

    if (!auth) {
      return {
        success: false,
        error: "Google Calendar is not configured",
      };
    }

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({
      version: "v3",
      auth,
    });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Google Calendar delete error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};


module.exports = {
  getAuthorizationUrl,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};