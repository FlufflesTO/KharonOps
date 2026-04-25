# Kharon Platform - Dual Mode Operation Guide

## Overview

This document provides guidance on running the Kharon Platform in dual mode with Google Sheets as the primary backend and PostgreSQL as the mirror. This configuration maintains full functionality while providing redundancy and preparation for future migration.

## Dual Mode Architecture

### How It Works

In dual mode, the system:
- Executes operations on the primary backend (Google Sheets)
- Mirrors the same operations to the secondary backend (PostgreSQL)
- Compares results to ensure consistency
- Logs any discrepancies for investigation
- Falls back to primary operations if secondary fails

### Benefits of Dual Mode
- **Data Redundancy**: Data exists in both systems simultaneously
- **Consistency Verification**: Automatic comparison between systems
- **Risk Mitigation**: Safe operation while maintaining backup
- **Migration Preparation**: Readies system for eventual PostgreSQL primary
- **Operational Continuity**: Maintains current workflows while building PostgreSQL capability

## Configuration

### Environment Variables

To run in dual mode with Google Sheets as primary, configure these environment variables:

```env
# Store backend configuration
STORE_BACKEND=dual

# Google Sheets configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8787/auth/callback

# PostgreSQL configuration (mirror)
POSTGRES_URL=postgresql://username:password@localhost:5432/kharon_platform_mirror
POSTGRES_DIRECT_URL=postgresql://username:password@localhost:5432/kharon_platform_mirror

# Rails mode (should be set to production for Google Sheets)
KHARON_RAILS_MODE=production
```

### Dual Mode Specific Configuration

The dual mode has specific configuration options:

```env
# Primary backend (what users interact with primarily)
DUAL_PRIMARY_BACKEND=sheets

# Secondary backend (mirror)
DUAL_SECONDARY_BACKEND=postgres

# Consistency check interval (in seconds)
DUAL_CONSISTENCY_CHECK_INTERVAL=300

# Log level for dual mode operations
DUAL_LOG_LEVEL=info
```

## Operational Guidelines

### Normal Operation

With dual mode configured:
1. All user-facing operations execute on Google Sheets
2. Mirror operations execute on PostgreSQL simultaneously
3. System compares results and logs any inconsistencies
4. If PostgreSQL mirror fails, system continues operating on Google Sheets
5. If Google Sheets fails, system can temporarily fall back to PostgreSQL data

### Monitoring

Monitor the following aspects of dual mode operation:

#### Consistency Checks
- Check logs for any discrepancies between backends
- Monitor sync queue for delays or failures
- Verify data integrity regularly

#### Performance
- Monitor response times (may be slightly slower due to dual writes)
- Watch for any failures in the mirror backend
- Track system resource usage

#### Error Handling
- Monitor error logs for backend-specific issues
- Track retry attempts for failed operations
- Watch for authentication issues with either backend

## Troubleshooting

### Common Issues

#### Authentication Problems
- **Symptoms**: Operations fail on Google Sheets
- **Solution**: Verify Google API credentials and permissions
- **Check**: Ensure service account has access to the spreadsheet

#### PostgreSQL Connection Issues
- **Symptoms**: Mirror operations failing, primary still functional
- **Solution**: Check PostgreSQL connection settings and availability
- **Note**: Primary operations continue even if mirror fails

#### Data Inconsistencies
- **Symptoms**: Discrepancies logged between backends
- **Solution**: Identify cause and reconcile data manually if needed
- **Prevention**: Monitor consistency checks regularly

### Log Analysis

Look for these patterns in logs:
- `[dual-store] primary succeeded, mirror failed` - Primary is OK, mirror issue needs attention
- `[dual-store] mirror succeeded, primary failed` - More serious, may affect users
- `[dual-store] consistency mismatch` - Data differences need investigation
- `[dual-store] both succeeded` - Normal operation

## Migration Preparation

While running in dual mode with Google Sheets as primary:

### Data Validation
- Regularly compare data between systems
- Identify any transformation issues
- Verify all operations work correctly in both backends

### Performance Monitoring
- Measure performance differences
- Identify bottlenecks in the dual-write process
- Optimize operations as needed

### Team Preparation
- Train team on PostgreSQL backend
- Develop procedures for eventual migration
- Create rollback plans if needed

## Rollback Procedures

If issues arise requiring a return to single-sheet mode:

1. Change environment configuration:
   ```env
   STORE_BACKEND=sheets
   ```

2. Restart the application
3. Verify operations continue normally on Google Sheets
4. Monitor for any issues

## Best Practices

### Operational Best Practices
- Monitor consistency logs regularly
- Maintain Google Sheets access permissions
- Keep PostgreSQL connection secure
- Regularly test failover procedures

### Data Management Best Practices
- Keep data formats consistent between backends
- Monitor for schema differences
- Validate data transformations
- Maintain backup procedures for both systems

### Security Best Practices
- Secure access credentials for both backends
- Monitor access logs for unusual activity
- Implement proper user permissions
- Encrypt sensitive data in both systems

## Future Migration Considerations

### Readiness Indicators
- Consistent operation without errors
- Acceptable performance levels
- Data integrity maintained over time
- Team comfortable with both backends

### Migration Planning
- Document all operations thoroughly
- Create detailed migration timeline
- Plan for potential downtime windows
- Prepare rollback procedures

## Conclusion

Running the Kharon Platform in dual mode with Google Sheets as the primary backend provides a safe path forward with redundancy and consistency checking. This configuration maintains all current functionality while building capability for future migration to PostgreSQL as the primary backend.

The dual mode architecture allows for gradual transition while ensuring operational continuity and data integrity.