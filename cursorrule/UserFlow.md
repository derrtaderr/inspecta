# InspectorAI: User Flow Documentation

This document outlines the various flows and interactions between the Cursor agent and InspectorAI for website design verification and debugging.

## Design Verification Flow

1. **Trigger**: 
   - The Cursor agent completes a task, such as designing a hero section.
   - The agent follows Cursor rules to verify the design before proceeding.

2. **Screenshot Capture**:
   - InspectorAI automatically navigates to the specified URL.
   - Captures a screenshot of the relevant section (e.g., `.hero-section`) or the full page.

3. **Feedback and Decision**:
   - Shares the screenshot with the Cursor agent for analysis.
   - If the design is correct (layout and text match expectations):
     - The agent approves and moves to the next task.
   - If the design is incorrect:
     - The agent identifies issues and redesigns.
     - Process repeats from step 2 (screenshot capture).

4. **Iteration Loop**:
   - The agent may need multiple iterations to achieve the desired design.
   - Each iteration follows the same verification process.

## Error Handling Flow

1. **Error Detection**:
   - If the screenshot shows a blank page, error screen, or unexpected result:
     - InspectorAI automatically checks for possible issues.

2. **Console Log Analysis**:
   - Retrieves JavaScript console logs from the browser.
   - Analyzes for errors like `Uncaught TypeError`, `ReferenceError`, etc.
   - Extracts error messages, line numbers, and stack traces.

3. **Network Request Analysis**:
   - Monitors network requests and responses.
   - Identifies failed requests (e.g., 404, 500 errors).
   - Analyzes payload and response data for issues.

4. **Debugging Assistance**:
   - Provides comprehensive error data to the Cursor agent.
   - The agent uses this information to debug and fix issues.
   - After fixes are applied, returns to the design verification flow.

## Interactive Query Flow

1. **Agent Query**:
   - The Cursor agent may ask specific questions, such as:
     - "Can you check if element #hero-title is visible?"
     - "Are there any console errors?"
     - "Why is the API call to /data failing?"

2. **Targeted Analysis**:
   - InspectorAI performs the requested analysis:
     - Checks specific elements in the DOM.
     - Retrieves focused log information.
     - Analyzes specific network requests.

3. **Response and Action**:
   - Provides targeted response to the agent's query.
   - The agent uses this information to make informed decisions and take actions.

## Element Manipulation Flow

1. **Modification Request**:
   - The Cursor agent requests changes to DOM elements:
     - "Change the text of #title to 'Hello World'"
     - "Update the background color of .hero to #f5f5f5"

2. **Element Manipulation**:
   - InspectorAI locates the specified element.
   - Applies the requested changes using browser automation.

3. **Verification**:
   - Captures a new screenshot after changes.
   - Confirms the changes were applied correctly.
   - The agent reviews and decides if further modifications are needed.

## Complete Workflow Example

### Scenario: Building a Hero Section

1. The Cursor agent builds a hero section with title, description, and CTA button.
2. Following Cursor rules, it requests verification from InspectorAI.
3. InspectorAI captures a screenshot of the hero section.
4. The Cursor agent reviews the screenshot and notices the CTA button is misaligned.
5. The agent makes CSS adjustments to fix the alignment.
6. InspectorAI takes another screenshot showing the fixed design.
7. The agent approves the design and moves to the next section.

### Scenario: Debugging a Broken Component

1. The Cursor agent builds a data visualization component.
2. InspectorAI's screenshot shows the component is not rendering.
3. InspectorAI checks console logs and finds: "Uncaught TypeError: Cannot read property 'map' of undefined".
4. InspectorAI also notices a failed API call to "/api/chart-data" with a 404 error.
5. The Cursor agent fixes the API endpoint path and adds null checking.
6. InspectorAI takes a new screenshot showing the properly rendered component.
7. The agent verifies and continues to the next task.

## Success Criteria

- **Design Accuracy**: The Cursor agent should be able to verify and correct designs with minimal iterations (target: ≤3 iterations).
- **Error Resolution**: When errors occur, the debugging process should provide actionable information that leads to successful resolution.
- **Autonomy**: The entire process should work with minimal human intervention, allowing the Cursor agent to complete design tasks end-to-end. 