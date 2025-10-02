# User Guide - Scheduling App

## 🎯 Getting Started

Welcome to your new scheduling application! This guide will help you set up your account and start accepting bookings from clients.

### What You Can Do

- **Create Meeting Types**: Set up different types of meetings with custom durations
- **Connect Your Calendar**: Sync with Google Calendar or Microsoft Outlook
- **Share Your Booking Link**: Let clients book time with you automatically
- **Manage Bookings**: View, reschedule, and cancel appointments
- **Get Notifications**: Receive email and SMS reminders

## 📝 Account Setup

### 1. Create Your Account

1. Visit the registration page
2. Fill in your details:
   - **First Name & Last Name**: Your display name
   - **Username**: This will be part of your booking URL
   - **Email**: For notifications and login
   - **Password**: Choose a strong password

3. Click "Create Account"
4. You'll be redirected to your dashboard

### 2. Complete Your Profile

1. Go to your dashboard
2. Click on your profile settings
3. Add additional information:
   - Profile photo (optional)
   - Bio or description
   - Time zone
   - Notification preferences

## 🗓️ Calendar Integration

### Connect Google Calendar

1. Go to **Calendar Integration** in your dashboard
2. Click **"Connect Google Calendar"**
3. You'll be redirected to Google
4. Sign in and grant permissions:
   - Read your calendar events
   - Create new events
   - Modify existing events
5. You'll be redirected back to your dashboard

### Connect Microsoft Outlook

1. Go to **Calendar Integration** in your dashboard
2. Click **"Connect Microsoft Calendar"**
3. Sign in with your Microsoft account
4. Grant the necessary permissions
5. Your calendar will be synced

### What Happens After Integration?

- **Availability Check**: The app checks your calendar for conflicts
- **Automatic Events**: New bookings create calendar events
- **Meeting Links**: Google Meet or Teams links are added automatically
- **Sync Updates**: Changes sync between your calendar and the app

## 📅 Creating Meeting Types

Meeting types define what services you offer and how clients can book them.

### 1. Create Your First Meeting Type

1. Go to **Meeting Types** in your dashboard
2. Click **"Create New Meeting Type"**
3. Fill in the details:

**Basic Information:**
- **Title**: "30-minute Consultation" 
- **Description**: Brief description of what the meeting covers
- **Duration**: 30 minutes
- **URL Slug**: This creates your booking link

**Availability Settings:**
- **Buffer Before**: Time before the meeting (e.g., 5 minutes)
- **Buffer After**: Time after the meeting (e.g., 5 minutes)
- **Minimum Notice**: How far in advance bookings are required
- **Maximum Notice**: How far in advance bookings can be made

**Location Settings:**
- **Google Meet**: Automatically creates video meeting
- **Zoom**: Requires Zoom integration
- **Phone Call**: Provide phone number
- **In Person**: Provide address
- **Custom**: Any other location type

### 2. Set Your Availability

For each meeting type, set when you're available:

1. **Days of the Week**: Select which days you're available
2. **Time Slots**: Set start and end times for each day
3. **Multiple Slots**: Add multiple time blocks per day if needed

Example:
- **Monday**: 9:00 AM - 12:00 PM, 2:00 PM - 5:00 PM
- **Tuesday**: 10:00 AM - 4:00 PM
- **Wednesday**: Off
- **Thursday**: 9:00 AM - 5:00 PM
- **Friday**: 9:00 AM - 3:00 PM

### 3. Notification Settings

Configure how you and your clients receive notifications:

**For You:**
- Email when someone books
- Email reminders before meetings
- SMS reminders (if configured)

**For Clients:**
- Booking confirmation email
- Reminder emails (24 hours, 1 hour before)
- SMS reminders (optional)

## 🔗 Sharing Your Booking Link

### Your Personal Booking Page

Your booking link format: `https://yourapp.com/schedule/your-username`

### Specific Meeting Type Links

For specific meeting types: `https://yourapp.com/schedule/your-username/meeting-slug`

### Ways to Share

1. **Email Signature**: Add your booking link to your email signature
2. **Website**: Embed the link on your website
3. **Social Media**: Share in your bio or posts
4. **Business Cards**: Include the QR code or short URL
5. **Direct Messages**: Send to clients directly

### Customizing Your Booking Page

- **Welcome Message**: Personalize the greeting
- **Instructions**: Add specific instructions for clients
- **Branding**: Customize colors and styling (Pro feature)

## 👥 Managing Bookings

### View Your Bookings

1. Go to **Bookings** in your dashboard
2. See all upcoming and past appointments
3. Filter by:
   - Date range
   - Meeting type
   - Status (confirmed, cancelled, completed)

### Booking Details

Click on any booking to see:
- Client information
- Meeting details
- Calendar event link
- Meeting URL (Google Meet, Zoom, etc.)
- Notes from the client

### Reschedule a Booking

1. Open the booking details
2. Click **"Reschedule"**
3. Select a new time slot
4. The client will be notified automatically
5. Calendar events are updated

### Cancel a Booking

1. Open the booking details
2. Click **"Cancel"**
3. Optionally add a cancellation reason
4. The client will be notified
5. Calendar event is removed

## 📧 Notifications & Reminders

### Email Notifications

You'll receive emails for:
- **New Bookings**: Immediate notification
- **Cancellations**: When clients cancel
- **Reschedules**: When clients reschedule
- **Reminders**: Before your meetings

### SMS Notifications (Optional)

If you've configured Twilio:
- Meeting reminders 1 hour before
- Last-minute booking alerts
- Cancellation notifications

### Client Notifications

Your clients automatically receive:
- **Booking Confirmation**: With meeting details and calendar invite
- **Reminder Emails**: 24 hours and 1 hour before
- **Reschedule Confirmations**: When meetings are moved
- **Cancellation Notices**: When meetings are cancelled

## 🛠️ Advanced Features

### Multiple Meeting Types

Create different meeting types for different services:
- **Quick Chat**: 15 minutes, free
- **Consultation**: 30 minutes, paid
- **Strategy Session**: 60 minutes, premium
- **Follow-up**: 15 minutes, existing clients only

### Availability Rules

Set complex availability rules:
- **Different hours per day**
- **Lunch breaks and buffer times**
- **Blackout dates** (vacations, holidays)
- **Maximum bookings per day**

### Client Information Collection

Customize what information you collect:
- **Required fields**: Name, email
- **Optional fields**: Phone, company, notes
- **Custom questions**: Specific to your business

## 🔧 Settings & Preferences

### Account Settings

- **Profile Information**: Update your details
- **Password**: Change your password
- **Time Zone**: Set your local time zone
- **Language**: Choose your preferred language

### Notification Preferences

- **Email Notifications**: Choose which emails to receive
- **SMS Notifications**: Enable/disable SMS alerts
- **Reminder Timing**: Customize when reminders are sent

### Privacy Settings

- **Public Profile**: Control what information is visible
- **Booking Requirements**: Set approval requirements
- **Data Retention**: Manage how long data is kept

## 🆘 Troubleshooting

### Common Issues

**Calendar Not Syncing:**
1. Check your calendar integration status
2. Reconnect your calendar if needed
3. Verify permissions are granted
4. Contact support if issues persist

**Clients Can't Book:**
1. Check your availability settings
2. Ensure meeting type is active
3. Verify your booking link is correct
4. Check for calendar conflicts

**Not Receiving Notifications:**
1. Check your email spam folder
2. Verify notification settings
3. Ensure email address is correct
4. Check SMS settings if using SMS

**Meeting Links Not Working:**
1. Verify calendar integration
2. Check Google Meet/Teams settings
3. Ensure proper permissions are granted
4. Try reconnecting your calendar

### Getting Help

**Documentation:**
- Check this user guide
- Review the FAQ section
- Watch tutorial videos

**Support:**
- Email: support@yourapp.com
- Live chat: Available during business hours
- Help center: Comprehensive articles and guides

## 📈 Best Practices

### Optimize Your Booking Process

1. **Clear Descriptions**: Write clear meeting type descriptions
2. **Appropriate Durations**: Don't make meetings too long or short
3. **Buffer Times**: Always include buffer time between meetings
4. **Professional Setup**: Use a professional email and profile

### Client Experience

1. **Quick Booking**: Make it easy for clients to find available times
2. **Clear Instructions**: Provide clear meeting instructions
3. **Timely Responses**: Respond to booking requests promptly
4. **Follow Up**: Send follow-up emails after meetings

### Calendar Management

1. **Keep Updated**: Keep your calendar current
2. **Block Personal Time**: Block out personal appointments
3. **Set Boundaries**: Don't allow bookings outside business hours
4. **Regular Review**: Review and adjust availability regularly

---

## 🎉 You're Ready!

Congratulations! You now have everything you need to start accepting bookings. Your clients can visit your booking page and schedule time with you automatically.

**Next Steps:**
1. Create your first meeting type
2. Connect your calendar
3. Share your booking link
4. Start accepting bookings!

**Need Help?** Contact our support team anytime - we're here to help you succeed!
