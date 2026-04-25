# Do Not Repeat - KharonOps Platform

## Overview
This document catalogues mistakes, problematic patterns, and anti-patterns from the existing codebase that must be avoided in the rebuild.

## Critical Mistakes to Avoid

### DNR1: Client-Side Role Assumptions
- **Problem**: Trusting client-provided role claims without server validation
- **Where Found**: Various route handlers that rely on client role
- **Why Problematic**: Security vulnerability allowing privilege escalation
- **Solution**: Always validate permissions server-side
- **How to Avoid**: Implement role validation middleware for all sensitive operations
- **Status**: Critical - Never repeat

### DNR2: Direct Google API Calls from UI
- **Problem**: Making Google API calls directly from browser UI
- **Where Found**: Previous implementations where UI called Google APIs directly
- **Why Problematic**: Exposure of API keys, CORS issues, rate limiting problems
- **Solution**: Always proxy through backend services
- **How to Avoid**: Implement backend service layer for all external API calls
- **Status**: Critical - Never repeat

### DNR3: Global Function Dependencies
- **Problem**: Using global functions that may not be loaded
- **Where Found**: References like `loadAdminHealth is not defined`
- **Why Problematic**: Runtime errors when functions are missing or renamed
- **Solution**: Use proper module imports/exports
- **How to Avoid**: Strict module system with explicit dependencies
- **Status**: Critical - Never repeat

### DNR4: Mixed Mock and Production Data
- **Problem**: Randomly mixing mock data with live data implementations
- **Where Found**: Inconsistent data handling based on environment flags
- **Why Problematic**: Risk of exposing test data in production or vice versa
- **Solution**: Clear adapter pattern with distinct implementations
- **How to Avoid**: Use abstract repository pattern with concrete implementations
- **Status**: Critical - Never repeat

## High-Impact Mistakes to Avoid

### DNR5: Inconsistent Error Handling
- **Problem**: Different error handling patterns in different places
- **Where Found**: Some routes throw errors, others return error responses
- **Why Problematic**: Unpredictable behavior, difficult debugging
- **Solution**: Standardized error handling approach
- **How to Avoid**: Implement global error middleware and standard error types
- **Status**: High - Never repeat

### DNR6: Tight Coupling Between UI and Business Logic
- **Problem**: Business logic embedded in UI components
- **Where Found**: Calculations and validations happening in React components
- **Why Problematic**: Difficult to test, maintain, and reuse logic
- **Solution**: Separate business logic into dedicated services/hooks
- **How to Avoid**: Clean architecture principles with clear boundaries
- **Status**: High - Never repeat

### DNR7: Hardcoded Production Values
- **Problem**: Hardcoding IDs, URLs, or other production-specific values
- **Where Found**: Google Sheet IDs, API endpoints, role names
- **Why Problematic**: Impossible to have safe staging environments
- **Solution**: Use configuration management system
- **How to Avoid**: Environment-based configuration with validation
- **Status**: High - Never repeat

### DNR8: Inadequate Input Sanitization
- **Problem**: Insufficient validation of user inputs
- **Where Found**: API endpoints that accept raw user data without validation
- **Why Problematic**: Injection attacks and data corruption
- **Solution**: Comprehensive input validation at all entry points
- **How to Avoid**: Schema validation for all inputs using Zod or similar
- **Status**: High - Never repeat

## Medium-Impact Mistakes to Avoid

### DNR9: Orphaned Files and Dead Code
- **Problem**: Files that are no longer used but remain in the codebase
- **Where Found**: Unused components, functions, or entire files
- **Why Problematic**: Increases maintenance burden, confuses developers
- **Solution**: Regular codebase cleanup and dependency analysis
- **How to Avoid**: Regular refactoring sessions and code reviews
- **Status**: Medium - Avoid in rebuild

### DNR10: Inconsistent Naming Conventions
- **Problem**: Inconsistent naming for similar concepts
- **Where Found**: Different names for the same entity in different parts
- **Why Problematic**: Confusion and difficulty finding code
- **Solution**: Consistent naming conventions across the codebase
- **How to Avoid**: Establish and enforce style guide from the beginning
- **Status**: Medium - Avoid in rebuild

### DNR11: Improper State Management
- **Problem**: Inconsistent state management patterns
- **Where Found**: Mix of React state, local storage, and global state
- **Why Problematic**: State inconsistencies and debugging difficulties
- **Solution**: Clear state management strategy
- **How to Avoid**: Define clear state management architecture upfront
- **Status**: Medium - Avoid in rebuild

### DNR12: Weak Offline Handling
- **Problem**: Poor handling of offline states and sync conflicts
- **Where Found**: Silent failures or data loss during sync
- **Why Problematic**: Data integrity issues and user frustration
- **Solution**: Clear offline state indicators and robust sync handling
- **How to Avoid**: First-class offline support design from the beginning
- **Status**: Medium - Avoid in rebuild

## Low-Impact Mistakes to Avoid

### DNR13: Overly Complex Component Hierarchies
- **Problem**: Deep nesting of components making debugging difficult
- **Where Found**: Too many wrapper components
- **Why Problematic**: Difficult to trace issues and understand flow
- **Solution**: Flatter, more modular component structure
- **How to Avoid**: Design components with single responsibilities
- **Status**: Low - Minimize in rebuild

### DNR14: Insufficient Documentation
- **Problem**: Lack of documentation for complex business logic
- **Where Found**: Undocumented functions and workflows
- **Why Problematic**: Difficult onboarding and maintenance
- **Solution**: Comprehensive documentation for all complex systems
- **How to Avoid**: Document as you build, not after
- **Status**: Low - Address in rebuild

### DNR15: Magic Numbers and Strings
- **Problem**: Hardcoded values scattered throughout code
- **Where Found**: Status values, time limits, configuration values
- **Why Problematic**: Difficult to maintain and update
- **Solution**: Centralized constants and configuration
- **How to Avoid**: Define constants for all non-obvious values
- **Status**: Low - Address in rebuild

## Process Anti-Patterns to Avoid

### DNR16: AI Fragment Integration Without Review
- **Problem**: Direct integration of AI-generated code fragments without proper review
- **Where Found**: Inconsistent code patterns introduced by AI
- **Why Problematic**: Creates technical debt and inconsistencies
- **Solution**: Thorough review and integration process for AI-generated code
- **How to Avoid**: Code review process that includes AI-generated code validation
- **Status**: Process - Never repeat

### DNR17: Patching Instead of Refactoring
- **Problem**: Applying patches to fix issues instead of addressing root causes
- **Where Found**: Multiple patches to fix variations of the same issue
- **Why Problematic**: Accumulates technical debt and fragility
- **Solution**: Address root causes through proper refactoring
- **How to Avoid**: Fix issues completely when they are identified
- **Status**: Process - Never repeat

### DNR18: Changing Requirements Mid-Implementation
- **Problem**: Adding new features or changing requirements during implementation
- **Where Found**: Scope creep during development sprints
- **Why Problematic**: Leads to inconsistent implementations and technical debt
- **Solution**: Clearly defined requirements before implementation begins
- **How to Avoid**: Requirements freeze until implementation is complete
- **Status**: Process - Minimize in rebuild

## Prevention Strategies

### Architecture Decisions
1. Implement clean architecture with clear boundaries
2. Use abstraction layers to isolate concerns
3. Implement comprehensive error handling from the start
4. Design security measures into the architecture from the beginning

### Development Practices
1. Code reviews for all changes
2. Pair programming for complex implementations
3. Automated testing for all functionality
4. Static analysis tools to catch issues early

### Documentation Requirements
1. Document architecture decisions (ADRs)
2. Maintain up-to-date API documentation
3. Keep user guides updated with code changes
4. Document security measures and procedures

### Quality Assurance
1. Implement comprehensive test suites
2. Perform security reviews regularly
3. Conduct performance testing early
4. Perform peer reviews of critical code

## Monitoring Success

This list should be referenced during code reviews and planning sessions to ensure these mistakes are not repeated in the rebuild. Regular assessments should verify that new code does not exhibit these problematic patterns.