# Error Investigation Guide

This document explains how to investigate Firebase function errors using Request IDs.

## What is a Request ID?

A Request ID is a unique identifier extracted from Firebase Functions request headers. It helps you track and debug specific errors in the Firebase Console.

### How Request IDs are Extracted

The system extracts Request IDs from two possible headers (in order of preference):

1. `x-cloud-trace-context` - The trace ID (first part before `/`)
2. `x-goog-request-id` - Google's request ID header

If neither header is available, the Request ID will be `undefined` or `"unknown"` in logs.

### Where to Find Request IDs

- **In Error Responses**: Request IDs are included in tRPC error responses under `data.requestId`
- **In Console Logs**: All error logs include a `requestId` field
- **In Client Errors**: Request IDs are available in error objects as `data.requestId` or `requestId`

## How to Look Up an Error by Request ID

### Method 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Functions** → **Logs**
4. In the search bar, enter the Request ID (e.g., `77cebf8e-ba12-4370-8de6-fc81d20bc5b2`)
5. Review the logs around the time of the error

**Note**: Look for log entries with `[tRPC]` prefix that include the `requestId` field in their JSON payload.

### Method 2: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **Cloud Functions** → **Logs**
4. Search for the Request ID directly, or use the filter:

   ```
   resource.labels.function_name="trpc" AND jsonPayload.requestId="YOUR_REQUEST_ID"
   ```

5. For trace-based Request IDs (from `x-cloud-trace-context`), you can also search by trace:

   ```
   trace="projects/YOUR_PROJECT_ID/traces/YOUR_REQUEST_ID"
   ```

### Method 3: Using gcloud CLI

```bash
# Install gcloud CLI if not already installed
# Then run:
gcloud functions logs read --project YOUR_PROJECT_ID --filter="requestId=YOUR_REQUEST_ID"

# Or search in Cloud Logging:
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=trpc AND jsonPayload.requestId=YOUR_REQUEST_ID" --project YOUR_PROJECT_ID --limit 50
```

## Common Error Types

### 1. Authentication Errors

- **Code**: `unauthenticated`
- **Cause**: User not logged in or invalid token
- **Solution**: Check authentication flow

### 2. Permission Errors

- **Code**: `permission-denied`
- **Cause**: User lacks required permissions
- **Solution**: Check Firestore security rules

### 3. Validation Errors

- **Code**: `invalid-argument`
- **Cause**: Invalid input data
- **Solution**: Check request payload validation

### 4. Internal Server Errors

- **Code**: `internal`
- **Cause**: Unexpected server error
- **Solution**: Check function logs for stack traces

### 5. Timeout Errors

- **Code**: `deadline-exceeded`
- **Cause**: Function took too long to execute
- **Solution**: Optimize function or increase timeout

### 6. Resource Exhausted

- **Code**: `resource-exhausted`
- **Cause**: Quota limits reached
- **Solution**: Check Firebase quota usage

## Error Logging Implementation

The error handling includes:

- **Request IDs in all error logs**: Extracted from `x-cloud-trace-context` or `x-goog-request-id` headers
- **Request method and URL**: Included in unhandled error logs
- **Full error stack traces**: Complete error details with message, stack, and name
- **Request ID in error responses**: Included in tRPC error responses under `data.requestId`

### Log Format Examples

**tRPC Error Logs**:
```json
{
  "requestId": "77cebf8e-ba12-4370-8de6-fc81d20bc5b2",
  "method": "POST",
  "url": "/trpc/...",
  "error": {
    "message": "Error message",
    "stack": "Error stack trace",
    "name": "Error"
  }
}
```

**Auth Error Logs**:
```json
{
  "requestId": "77cebf8e-ba12-4370-8de6-fc81d20bc5b2",
  "error": {
    "message": "Auth error message",
    "stack": "Error stack trace",
    "name": "Error"
  }
}
```

## Next Steps

1. **Extract the Request ID** from the error response or client-side error object
2. **Check Firebase Console Logs** using the Request ID
3. **Identify the error type** from the logs
4. **Check the timestamp** to see when it occurred
5. **Review the stack trace** for detailed error information
6. **Check related logs** before and after the error

## Getting More Context

If you need more information about a specific error:

1. **Extract Request ID from client error**:

   ```typescript
   const requestId = error?.data?.requestId || error?.requestId;
   ```

2. **Check the function logs** around the time of the error using the Request ID

3. **Review the request payload** (if logged) - check logs for the specific Request ID

4. **Check Firestore security rules** for permission issues

5. **Verify API keys and secrets** are properly configured in Firebase Functions

6. **Check function quotas** and limits in Google Cloud Console

7. **Look for related logs** with the same trace ID (if using `x-cloud-trace-context`)

## Contact Support

If you cannot resolve the error:

- Include the Request ID in your support request
- Include the timestamp of the error
- Include any relevant error messages from the logs
- Include steps to reproduce (if applicable)
