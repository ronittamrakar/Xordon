# SignalWire Call Logs Extraction Guide

This guide explains how to extract call logs from SignalWire for specific phone numbers using the provided scripts.

## Overview

The system includes two main scripts for working with SignalWire call logs:

1. **`test_signalwire_connection.php`** - Tests your SignalWire connection and API access
2. **`pull_signalwire_logs.php`** - Extracts call logs for specific phone numbers

## Prerequisites

Before using these scripts, ensure you have:

1. **SignalWire Account**: Active SignalWire account with API access
2. **Database Connection**: The scripts connect to your application database to get SignalWire credentials
3. **SignalWire Connection**: SignalWire must be configured in your application under Settings > Connections

## Setup

### 1. Configure SignalWire in Your Application

1. Log into your application
2. Go to **Settings > Connections**
3. Add a new SignalWire connection with:
   - **Project ID**: Your SignalWire project ID
   - **Space URL**: Your SignalWire space URL (e.g., `your-space.signalwire.com`)
   - **API Token**: Your SignalWire API token
4. Save the connection and ensure it's marked as **Active**

### 2. Verify Database Access

The scripts require access to your application database. Ensure:

- The `backend/src/Database.php` file has correct database credentials
- The `connections` table contains your SignalWire configuration
- You have read access to the database

## Usage

### Testing Your Connection

Before extracting call logs, test your SignalWire connection:

```bash
php test_signalwire_connection.php
```

This script will:
- ✅ Load SignalWire configuration from your database
- ✅ Test account information access
- ✅ Test available numbers endpoint
- ✅ Test call logs endpoint access

**Expected Output:**
```
🧪 Testing SignalWire Connection
================================

✓ SignalWire configuration loaded
  Account ID: your-project-id
  Space URL: your-space.signalwire.com

🔍 Testing account information...
✓ Account info retrieved successfully
  Account SID: your-account-sid
  Status: active

📞 Testing available numbers...
✓ Available numbers endpoint working
  Found 15 available numbers

📋 Testing call logs access...
✓ Call logs endpoint working
  Found 5 recent calls

✅ All SignalWire connection tests passed!
```

### Extracting Call Logs

Once your connection is tested, extract call logs for specific numbers:

```bash
# Basic usage - extract logs for one number
php pull_signalwire_logs.php +1234567890

# Extract logs for multiple numbers
php pull_signalwire_logs.php +1234567890 +1234567891 +1234567892

# Extract logs for a specific date range
php pull_signalwire_logs.php +1234567890 start=2025-12-01 end=2025-12-31
```

**Command Line Parameters:**

- **Phone Numbers**: List of phone numbers to extract logs for (required)
- **start=YYYY-MM-DD**: Optional start date (defaults to 30 days ago)
- **end=YYYY-MM-DD**: Optional end date (defaults to today)

### Example Usage

```bash
# Extract logs for your main business line
php pull_signalwire_logs.php +15551234567

# Extract logs for multiple numbers with date range
php pull_signalwire_logs.php +15551234567 +15551234568 start=2025-12-01 end=2025-12-15

# Extract logs for all your SignalWire numbers
php pull_signalwire_logs.php +15551234567 +15551234568 +15551234569 +15551234570
```

## Output

### Console Output

The script displays a formatted summary of call logs:

```
🚀 SignalWire Call Logs Extractor
================================

✓ Connected to SignalWire account: your-project-id
✓ Space URL: your-space.signalwire.com

📅 Date range: 2025-12-01 to 2025-12-31
📞 Numbers to check: +15551234567, +15551234568

🔍 Fetching call logs for: +15551234567
   ✓ Found 15 call(s)
🔍 Fetching call logs for: +15551234568
   ✓ Found 8 call(s)

================================================================================
SIGNALWIRE CALL LOGS SUMMARY
================================================================================

📞 +15551234567 (outbound calls)
------------------------------------------------------------
  📋 Call SID: CA1234567890abcdef
     📅 Date: 2025-12-15 14:30:22
     🕐 Duration: 120 seconds
     📞 From: +15551234567
     📞 To: +15559876543
     🏷️  Status: completed
     💰 Cost: $0.02 USD
     🔄 Direction: outbound

📞 +15551234568 (inbound calls)
------------------------------------------------------------
  📋 Call SID: CA0987654321abcdef
     📅 Date: 2025-12-14 10:15:33
     🕐 Duration: 45 seconds
     📞 From: +15551112222
     📞 To: +15551234568
     🏷️  Status: completed
     💰 Cost: $0.01 USD
     🔄 Direction: inbound

📊 SUMMARY
------------------------------
Total phone numbers checked: 2
Total calls found: 23

📁 Exported call logs to: signalwire_call_logs_2025-12-31_02-08-15.csv
✅ Process completed successfully!
📄 CSV file: signalwire_call_logs_2025-12-31_02-08-15.csv
```

### CSV Export

The script automatically exports all call logs to a CSV file with the following columns:

- **Call SID**: Unique identifier for the call
- **Date Created**: When the call was created
- **Date Updated**: When the call was last updated
- **Start Time**: Call start time
- **End Time**: Call end time
- **Duration**: Call duration in seconds
- **From Number**: Caller's phone number
- **To Number**: Recipient's phone number
- **Direction**: inbound or outbound
- **Status**: call status (completed, busy, failed, etc.)
- **Price**: Call cost
- **Price Unit**: Currency (usually USD)
- **API Version**: SignalWire API version used
- **Forwarded From**: If call was forwarded
- **Caller Name**: Caller ID name (if available)
- **Parent Call SID**: For conference calls
- **Phone Number SID**: SignalWire phone number identifier
- **Trunk SID**: Trunk identifier (if using SIP trunking)
- **SIP Response Code**: SIP response code
- **Account SID**: SignalWire account identifier
- **URI**: SignalWire API URI for the call

## Troubleshooting

### Common Issues

1. **"No active SignalWire connection found"**
   - Ensure SignalWire is configured in Settings > Connections
   - Verify the connection status is "Active"
   - Check that all required fields (Project ID, Space URL, API Token) are filled

2. **"SignalWire credentials incomplete"**
   - Verify all SignalWire credentials are properly entered
   - Check for typos in Project ID, Space URL, or API Token

3. **"HTTP 401: Unauthorized"**
   - Verify your API Token is correct and hasn't expired
   - Ensure your SignalWire account has API access enabled

4. **"HTTP 429: Too Many Requests"**
   - SignalWire has rate limits (typically 100 requests per second)
   - The script includes built-in delays to prevent this
   - If you're running multiple scripts, add delays between them

5. **"Connection timed out"**
   - Check your internet connection
   - Verify SignalWire space URL is correct
   - Try again in a few minutes (temporary network issues)

### Debug Mode

For debugging, you can add error logging to the scripts:

```php
// Add this line after curl_exec() in pull_signalwire_logs.php
error_log("SignalWire API Response: " . substr($response, 0, 500));
```

## Security Notes

1. **API Tokens**: Never commit your SignalWire API tokens to version control
2. **Database Access**: Ensure database credentials are secure
3. **File Permissions**: Set appropriate file permissions on the scripts
4. **Log Files**: CSV exports may contain sensitive call information

## Advanced Usage

### Custom Date Ranges

```bash
# Last 7 days
php pull_signalwire_logs.php +15551234567 start=2025-12-24 end=2025-12-31

# Last month
php pull_signalwire_logs.php +15551234567 start=2025-11-01 end=2025-11-30

# Specific week
php pull_signalwire_logs.php +15551234567 start=2025-12-15 end=2025-12-21
```

### Batch Processing

For processing many numbers, create a batch script:

```bash
#!/bin/bash
# batch_extract.sh

NUMBERS=(
    "+15551234567"
    "+15551234568" 
    "+15551234569"
    "+15551234570"
)

for number in "${NUMBERS[@]}"; do
    echo "Processing $number..."
    php pull_signalwire_logs.php "$number" start=2025-12-01 end=2025-12-31
    sleep 2  # Add delay between requests
done
```

### Integration with Other Systems

The CSV output can be imported into:
- **Excel/Google Sheets**: For analysis and reporting
- **CRM Systems**: To enrich customer records
- **Analytics Tools**: For call pattern analysis
- **Billing Systems**: For cost tracking

## Support

If you encounter issues:

1. Run `test_signalwire_connection.php` first to verify your setup
2. Check the SignalWire dashboard for any account issues
3. Review SignalWire API documentation: https://signalwire.com/documentation
4. Contact your system administrator for database access issues

## SignalWire API Documentation

For more information about SignalWire's API:
- SignalWire REST API: https://signalwire.com/documentation
- Call Logs API: https://signalwire.com/documentation#calls
- Authentication: https://signalwire.com/documentation#authentication