# InspectorAI Project Documentation

## Overview

InspectorAI is a system designed to enhance the Cursor agent's ability to autonomously verify and refine website designs. It integrates seamlessly with the agent's workflow, ensuring designs are correct before moving forward, and handles errors by checking logs and network data when needed.

The system enables the Cursor agent to build website components (like a hero section), verify their appearance through screenshots, identify and fix issues, and ensure designs meet expectations without requiring manual intervention.

## Documentation Structure

This folder contains the comprehensive documentation for the InspectorAI project:

1. **[InspectorAI_PRD.md](./InspectorAI_PRD.md)** - Product Requirements Document
   - Detailed outline of InspectorAI's purpose, features, and requirements
   - Functional and non-functional specifications
   - Success metrics and assumptions

2. **[UserFlow.md](./UserFlow.md)** - User Flow Documentation
   - Detailed workflows for design verification
   - Error handling procedures
   - Interactive query flows
   - Element manipulation procedures
   - Complete workflow examples

3. **[CursorRules.md](./CursorRules.md)** - Cursor Agent Rules
   - Guidelines the Cursor agent must follow when working with InspectorAI
   - Design verification rules
   - Error handling protocols
   - API interaction requirements
   - Process flow rules

4. **[TechnicalSpecification.md](./TechnicalSpecification.md)** - Technical Details
   - System architecture and components
   - Technology stack and justification
   - Project structure and organization
   - API endpoints and database schema
   - Implementation plan and considerations

## Key Features

- **Autonomous Design Verification**: Automatically captures screenshots after the Cursor agent completes a task, enabling it to approve or redesign.
  
- **Error Detection and Reporting**: If a design fails to render properly, checks console logs and network requests for debugging.
  
- **Interactive Interface**: Allows the Cursor agent to ask specific questions about the website state and make targeted modifications.
  
- **Process Automation**: Streamlines the design-verify-fix cycle to minimize the need for human intervention.

## Implementation Approach

InspectorAI is implemented as a microservices architecture with these core components:

1. **Browser Automation Service** using Puppeteer for controlling Chrome
2. **API Gateway** for exposing REST endpoints to the Cursor agent
3. **Analysis Service** for processing screenshots and extracted data
4. **Logging and Monitoring Service** for system health tracking

## Getting Started

To utilize the InspectorAI system:

1. Ensure the Cursor agent is configured to follow the rules in [CursorRules.md](./CursorRules.md)
2. Implement the system according to the specifications in [TechnicalSpecification.md](./TechnicalSpecification.md)
3. Follow the user flows outlined in [UserFlow.md](./UserFlow.md) for effective usage

## Development Roadmap

The implementation plan is divided into three phases:

1. **Phase 1**: Core functionality - browser automation and screenshot capabilities
2. **Phase 2**: Enhanced analysis - network monitoring and error detection
3. **Phase 3**: Advanced features - image analysis and CI/CD integration

## Success Criteria

The system will be considered successful if:

1. The Cursor agent can verify designs with minimal iterations (≤3 redesigns on average)
2. Debugging time is reduced through actionable error feedback
3. The agent can work autonomously on design tasks without human intervention 