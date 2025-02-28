# Cursor Agent Rules for InspectorAI Integration

This document outlines the rules that the Cursor agent must follow when working with InspectorAI to ensure effective design verification and debugging.

## Design Verification Rules

1. **Mandatory Verification**
   - The Cursor agent MUST verify all visual designs after implementation by requesting InspectorAI to take a screenshot.
   - Verification MUST occur after completing any of the following:
     - Creating new UI components or sections
     - Making significant changes to existing components
     - Fixing visual bugs or layout issues

2. **Design Analysis**
   - The Cursor agent MUST analyze the screenshot provided by InspectorAI to verify:
     - All elements are properly rendered and visible
     - Layout matches the intended design
     - Text content is correct and properly formatted
     - Interactive elements (buttons, forms) appear functional
     - Responsive design works as expected (if multiple viewport sizes are tested)

3. **Iteration Protocol**
   - If design issues are detected, the Cursor agent MUST:
     - Clearly identify and document each issue
     - Make specific code changes to address each issue
     - Request a new verification screenshot after changes
     - Limit redesign iterations to a maximum of 3 before seeking additional guidance

## Error Handling Rules

1. **Error Detection**
   - If a design fails to render properly (blank page, error screen, missing elements):
     - The Cursor agent MUST request console log and network request data from InspectorAI
     - The agent MUST NOT proceed to new tasks until the error is resolved

2. **Debugging Protocol**
   - When debugging errors, the Cursor agent MUST:
     - Analyze console logs for JavaScript errors
     - Check network requests for failed API calls or resource loading issues
     - Verify HTML structure for missing or malformed elements
     - Test with minimal test cases when appropriate

3. **Documentation**
   - The Cursor agent MUST document all encountered errors and their solutions for future reference
   - Documentation should include:
     - Error description
     - Root cause
     - Solution implemented
     - Verification that the solution worked

## API Interaction Rules

1. **Screenshot Requests**
   - When requesting screenshots, the Cursor agent MUST specify:
     - Target URL to navigate to
     - Specific element selector if only a component needs verification (e.g., `.hero-section`)
     - Viewport size if testing responsive design

2. **Console Log Requests**
   - When requesting console logs, the Cursor agent MUST:
     - Specify the level of logs needed (errors only, all logs, etc.)
     - Request stack traces for errors when available

3. **Element Manipulation**
   - When requesting DOM element changes, the Cursor agent MUST:
     - Provide precise selector for the target element
     - Specify exact changes needed (text content, attributes, styles)
     - Request verification after changes are made

## Process Flow Rules

1. **Task Sequencing**
   - The Cursor agent MUST follow this sequence:
     1. Implement design/feature
     2. Request verification from InspectorAI
     3. Analyze results
     4. Fix issues if needed
     5. Re-verify until approved
     6. Document completion
     7. Proceed to next task

2. **Timeouts and Failure Handling**
   - If InspectorAI fails to provide a response or times out:
     - The Cursor agent MUST retry the request once
     - If failure persists, the agent should document the issue and suggest alternative verification methods

3. **Edge Cases**
   - For dynamic content (animations, transitions):
     - Request multiple screenshots at appropriate intervals
     - Verify each stage of the animation/transition
   - For interactive elements:
     - Request screenshots before and after simulated interactions

## Communication Rules

1. **Clear Requests**
   - All requests to InspectorAI MUST be clear, specific, and include all necessary parameters
   - Ambiguous requests that could be interpreted in multiple ways are prohibited

2. **Actionable Feedback**
   - When providing feedback on designs or errors, the Cursor agent MUST:
     - Be specific about what needs to be changed
     - Provide concrete code solutions
     - Explain the reasoning behind changes

3. **Progress Updates**
   - The Cursor agent MUST provide clear status updates at each stage of the verification process

## Compliance Statement

The Cursor agent must acknowledge and follow these rules when working with InspectorAI. Compliance with these rules ensures effective design verification, efficient debugging, and a seamless workflow for website development. 