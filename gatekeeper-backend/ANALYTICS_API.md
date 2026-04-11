# Analytics API Documentation

This document describes the analytics endpoints for tracking work hours and lunch breaks according to Chilean work laws.

## Overview

The analytics API provides endpoints to:

- Calculate total worked hours for weekly and monthly periods
- Track lunch break times
- Generate work hours summaries with daily breakdowns
- Support compliance with Chilean labor regulations

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Current Week Analytics

**GET** `/analytics/work-hours/current-week`

Returns work hours analytics for the current week (Monday to Sunday).

**Response:**

```json
{
  "totalWorkedHours": 40.5,
  "totalLunchTime": 5.0,
  "totalBreakTime": 0,
  "daysWorked": 5,
  "averageWorkedHoursPerDay": 8.1,
  "averageLunchTimePerDay": 1.0,
  "period": "week",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-21T23:59:59.999Z",
  "dailyBreakdown": [
    {
      "date": "2024-01-15",
      "workedHours": 8.0,
      "lunchTime": 1.0,
      "breakTime": 0,
      "clockInTime": "2024-01-15T08:00:00.000Z",
      "clockOutTime": "2024-01-15T17:00:00.000Z",
      "lunchStartTime": "2024-01-15T12:00:00.000Z",
      "lunchEndTime": "2024-01-15T13:00:00.000Z"
    }
  ]
}
```

### 2. Get Current Month Analytics

**GET** `/analytics/work-hours/current-month`

Returns work hours analytics for the current month.

**Response:** Same structure as week analytics, but with `period: "month"`.

### 3. Get Week Analytics for Specific Week

**GET** `/analytics/work-hours/week?startDate=2024-01-15`

Returns work hours analytics for a specific week starting from the provided date.

**Query Parameters:**

- `startDate` (required): ISO date string for the start of the week

**Response:** Same structure as current week analytics.

### 4. Get Month Analytics for Specific Month

**GET** `/analytics/work-hours/month?startDate=2024-01-01`

Returns work hours analytics for a specific month starting from the provided date.

**Query Parameters:**

- `startDate` (required): ISO date string for the start of the month

**Response:** Same structure as current month analytics.

### 5. Start Lunch Break

**POST** `/analytics/lunch-break/start`

Starts a lunch break for the authenticated user. Requires an active shift.

**Response:**

```json
{
  "id": "shift-id",
  "userId": "user-id",
  "clockInTime": "2024-01-15T08:00:00.000Z",
  "clockOutTime": null,
  "lunchStartTime": "2024-01-15T12:00:00.000Z",
  "lunchEndTime": null,
  "status": "active",
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

### 6. End Lunch Break

**POST** `/analytics/lunch-break/end`

Ends a lunch break for the authenticated user. Requires an active shift with a started lunch break.

**Response:**

```json
{
  "id": "shift-id",
  "userId": "user-id",
  "clockInTime": "2024-01-15T08:00:00.000Z",
  "clockOutTime": null,
  "lunchStartTime": "2024-01-15T12:00:00.000Z",
  "lunchEndTime": "2024-01-15T13:00:00.000Z",
  "status": "active",
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2024-01-15T13:00:00.000Z"
}
```

### 7. Get User Work Hours Analytics (Admin Only)

**GET** `/analytics/work-hours/user/{userId}?period=week&startDate=2024-01-15`

Returns work hours analytics for a specific user. Requires admin privileges.

**Path Parameters:**

- `userId`: The ID of the user to get analytics for

**Query Parameters:**

- `period` (required): Either "week" or "month"
- `startDate` (optional): ISO date string for the start of the period

**Response:** Same structure as other analytics endpoints.

## Data Structure

### WorkHoursSummary

```typescript
interface WorkHoursSummary {
  totalWorkedHours: number; // Total hours worked (excluding lunch)
  totalLunchTime: number; // Total lunch time in hours
  totalBreakTime: number; // Total break time in hours (excluding lunch)
  daysWorked: number; // Number of days with completed shifts
  averageWorkedHoursPerDay: number; // Average worked hours per day
  averageLunchTimePerDay: number; // Average lunch time per day
  period: 'week' | 'month'; // Period type
  startDate: Date; // Start of the period
  endDate: Date; // End of the period
  dailyBreakdown: DailyWorkHours[]; // Daily breakdown of hours
}
```

### DailyWorkHours

```typescript
interface DailyWorkHours {
  date: string; // Date in YYYY-MM-DD format
  workedHours: number; // Hours worked on this day
  lunchTime: number; // Lunch time on this day
  breakTime: number; // Break time on this day
  clockInTime: Date; // Clock in time
  clockOutTime?: Date; // Clock out time (if completed)
  lunchStartTime?: Date; // Lunch start time
  lunchEndTime?: Date; // Lunch end time
}
```

## Calculation Logic

### Worked Hours Calculation

Worked hours are calculated as:

```
Worked Hours = (Clock Out Time - Clock In Time) - Lunch Time
```

### Lunch Time Calculation

Lunch time is calculated as:

```
Lunch Time = Lunch End Time - Lunch Start Time
```

### Period Calculations

- **Week**: Monday to Sunday
- **Month**: 1st day of month to last day of month

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "startDate is required",
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Chilean Labor Law Compliance

The analytics system is designed to comply with Chilean labor regulations:

1. **Maximum Weekly Hours**: Tracks weekly hours to ensure compliance with 45-hour weekly limit
2. **Lunch Break Tracking**: Monitors mandatory lunch breaks
3. **Daily Breakdown**: Provides detailed daily records for audit purposes
4. **Monthly Summaries**: Generates monthly reports for payroll and compliance

## Usage Examples

### Get Current Week Analytics

```bash
curl -X GET "http://localhost:3000/analytics/work-hours/current-week" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Start Lunch Break

```bash
curl -X POST "http://localhost:3000/analytics/lunch-break/start" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Get Specific Week Analytics

```bash
curl -X GET "http://localhost:3000/analytics/work-hours/week?startDate=2024-01-15" \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Notes

- All times are stored and returned in UTC
- Worked hours exclude lunch breaks automatically
- Only completed shifts (with clock out time) are included in calculations
- The system supports multiple shifts per day for overtime tracking
- All calculations are rounded to 2 decimal places for precision
