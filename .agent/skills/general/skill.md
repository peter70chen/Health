---
name: AI Model and PDF
description: Documentation for Gemini Model Names and Reliable PDF Generation Techniques.
---

# AI Model and PDF Guide

## 1. Official Google Gemini Model Names (As of Jan 2026)

When configuring the API, use these precise model strings to avoid 404 errors:

| Model Version | API Model Name |
| :--- | :--- |
| **Gemini 3.0 Pro** | `gemini-3-pro-preview` |
| **Gemini 3.0 Flash** | `gemini-3-flash-preview` |

> **Note**: These names are for the Google AI Studio / Vertex AI API. Always verify against the latest documentation if connection fails.

---

## 2. Reliable PDF Generation (React/Client-Side)

### The Problem: `html2canvas` Instability
Using `html2canvas` to take a screenshot of a DOM element for PDF generation often leads to:
*   **Crashes/Blank Pages**: If the element is hidden, too large, or contains cross-origin images.
*   **"Flashing"**: Incorrect button types triggering form submissions and page reloads.
*   **Blurry Text**: Screenshots rasterize text, reducing print quality.

### The Solution: Native `jsPDF` Generation
Instead of screenshots, generate the PDF programmatically using the `jsPDF` library directly. This ensures crystal clear text and smaller file sizes.

### Implementation Checklist
1.  **Button Type**: Always ensure your export button has `type="button"` to prevent it from submitting parent forms:
    ```jsx
    <button type="button" onClick={handleExport}>Export PDF</button>
    ```

2.  **Text Rendering**: Use `doc.text()` and `doc.splitTextToSize()` for multi-line content.
    ```javascript
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(longString, maxWidth);
    doc.text(splitText, x, y);
    ```

3.  **Pagination**: Manually track your `yPos` (vertical cursor) and add pages when content exceeds the page height.
    ```javascript
    if (yPos + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
    }
    ```

4.  **Images**: If including images, use `doc.addImage()`. Ensure the image is fully loaded (e.g., waiting for `onload` promise) before adding, otherwise it may be blank.

### Code Example (Text-Only Report)
```javascript
import jsPDF from 'jspdf';

const handleExport = () => {
    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(16);
    doc.text("Analysis Report", 20, y);
    y += 10;

    // Content
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(content, 170); // 170mm width
    
    lines.forEach(line => {
        if (y > 280) { // Approx A4 height margin
            doc.addPage();
            y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
    });

    doc.save("report.pdf");
};
```

---

## 3. UI/UX Interaction Standards (Critical)

### BANNED: Native `window.confirm` / `window.alert`
**Never use** default browser confirmation dialogs for critical actions (like Delete or Clear).
*   **Reason**:
    *   They are blocking and provide poor UX.
    *   They often lose focus or are blocked by browser popup blockers.
    *   They cause "flashing" issues where the UI state updates before the interaction resolves.

### REQUIRED: Custom Modal for Confirmation
Always use a custom `Modal` component for confirmations.

#### Standard Implementation Pattern
1.  **State Management**: Use a specific state variable (e.g., `deleteTargetId`) instead of a simple boolean if managing a list.
2.  **Logic Separation**:
    *   `handleDeleteClick(id)`: Sets the target ID (opens modal).
    *   `confirmDelete()`: Executes the actual deletion logic (called by Modal's "Yes" button).
3.  **Example**:
    ```tsx
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    return (
        <>
            {/* Trigger */}
            <button onClick={() => setDeleteTarget(item.id)}>Delete</button>

            {/* Modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Confirm Action"
                footer={
                    <button onClick={confirmDelete}>Confirm</button>
                }
            >
                Are you sure?
            </Modal>
        </>
    );
    ```
