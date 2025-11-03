# FunPay Customizer - Testing Checklist

This document contains manual testing checklists for the FunPay Customizer extension.

## Table of Contents

1. [General Tests](#general-tests)
2. [Theme System Tests](#theme-system-tests)
3. [Lot Export Tests](#lot-export-tests)
4. [Browser Compatibility Tests](#browser-compatibility-tests)

---

## General Tests

### Installation

- [ ] Extension installs successfully in Chrome
- [ ] Extension installs successfully in Firefox
- [ ] Extension installs successfully in Edge
- [ ] Options page opens on first install
- [ ] Default settings are initialized correctly
- [ ] Extension icon appears in toolbar

### Popup Interface

- [ ] Popup opens when clicking extension icon
- [ ] All UI elements are visible and properly styled
- [ ] Dropdowns and inputs work correctly
- [ ] "Apply" button saves settings
- [ ] "Reset" button restores defaults
- [ ] "Advanced Settings" button opens options page
- [ ] Author credit is displayed in footer

### Storage

- [ ] Settings persist after browser restart
- [ ] Settings sync across tabs
- [ ] Storage doesn't exceed quota limits
- [ ] Settings can be reset to defaults

---

## Theme System Tests

### Preset Themes

- [ ] Default theme works (no changes)
- [ ] Dark theme applies correctly
- [ ] Light theme applies correctly
- [ ] Blue theme applies correctly
- [ ] Purple theme applies correctly
- [ ] Custom theme can be created and applied

### Theme Application

- [ ] Theme applies immediately on active tab
- [ ] Theme applies on page reload
- [ ] Theme applies on new FunPay tabs
- [ ] Theme persists across browser sessions
- [ ] Theme doesn't affect non-FunPay sites

### Font Customization

- [ ] Default font option works
- [ ] Google Fonts load correctly
- [ ] Font size slider works (12-20px)
- [ ] Font changes apply immediately
- [ ] Font settings persist

### Cover Images

- [ ] JPEG images upload successfully
- [ ] PNG images upload successfully
- [ ] GIF images upload successfully
- [ ] Image size limit (5MB) is enforced
- [ ] Image preview displays correctly
- [ ] Position options work (center, top, bottom, etc.)
- [ ] Size options work (cover, contain, auto)
- [ ] Remove button deletes cover image
- [ ] Cover displays with correct opacity (30%)

---

## Lot Export Tests

### Chrome Testing

#### Export Button Visibility

- [ ] Export button appears on lots pages
- [ ] Export button is positioned correctly (bottom-right)
- [ ] Export button has hover effects
- [ ] Export button doesn't appear on non-lots pages

#### Export via Page Button

- [ ] Clicking export button shows format dialog
- [ ] Format dialog has JSON option
- [ ] Format dialog has TXT option
- [ ] Selected format is remembered
- [ ] Cancel button closes dialog
- [ ] Backdrop closes dialog when clicked

#### Export Process

- [ ] Progress overlay appears when exporting
- [ ] Progress bar updates during export
- [ ] Progress text shows current step
- [ ] Progress shows percentage
- [ ] Success notification appears on completion
- [ ] Error notification appears on failure

#### JSON Export

- [ ] JSON file downloads successfully
- [ ] Filename includes timestamp
- [ ] JSON is valid and parseable
- [ ] Metadata section is complete
  - [ ] exportDate is ISO format
  - [ ] url is correct
  - [ ] pageTitle is present
  - [ ] sectionName is extracted
  - [ ] account info is present
  - [ ] totalLots matches array length
- [ ] Lots array contains all visible lots
- [ ] Each lot has all required fields:
  - [ ] id
  - [ ] title
  - [ ] price
  - [ ] currency
  - [ ] seller
  - [ ] sellerStatus
  - [ ] availability
  - [ ] timestamp
  - [ ] url
  - [ ] index

#### TXT Export

- [ ] TXT file downloads successfully
- [ ] Filename includes timestamp
- [ ] File is readable as plain text
- [ ] Header section is formatted correctly
- [ ] Each lot is separated clearly
- [ ] All lot information is present and readable
- [ ] Footer section is present

#### Export via Popup

- [ ] Export section is visible in popup
- [ ] Format dropdown shows JSON and TXT options
- [ ] Export button triggers export on active tab
- [ ] Success/error notifications appear
- [ ] Warning shown if not on lots page

#### Data Extraction

Test on different FunPay pages:

- [ ] `/lots/` pages
- [ ] `/offer/` pages
- [ ] `/chips/` pages
- [ ] Game-specific pages
- [ ] Category pages

Verify extracted data:

- [ ] Lot IDs are extracted correctly
- [ ] Titles are complete and trimmed
- [ ] Prices are parsed correctly
- [ ] Currency symbols detected (₽, $, €)
- [ ] Seller names extracted
- [ ] Online/offline status detected
- [ ] Availability status detected
- [ ] Timestamps extracted when available
- [ ] URLs are absolute and valid

#### Edge Cases

- [ ] Empty pages (no lots) show appropriate error
- [ ] Pages with 1 lot work correctly
- [ ] Pages with 100+ lots work correctly
- [ ] Duplicate lots are removed
- [ ] Lazy-loaded content is detected
- [ ] Export works after scrolling
- [ ] Export works on different lot layouts

#### Error Handling

- [ ] Unsupported page structure shows error
- [ ] Network errors are caught
- [ ] Download errors are handled gracefully
- [ ] Concurrent export attempts are prevented
- [ ] All errors show user-friendly messages

#### Performance

- [ ] Export of 10 lots completes in < 2 seconds
- [ ] Export of 50 lots completes in < 5 seconds
- [ ] Export of 100 lots completes in < 10 seconds
- [ ] No memory leaks during repeated exports
- [ ] Page remains responsive during export
- [ ] No console errors during export

### Firefox Testing

Repeat all Chrome tests in Firefox:

- [ ] Export button appears correctly
- [ ] Format dialog works
- [ ] Progress overlay displays
- [ ] JSON export works
- [ ] TXT export works
- [ ] Popup export works
- [ ] Data extraction accurate
- [ ] Edge cases handled
- [ ] Error handling works
- [ ] Performance acceptable

#### Firefox-Specific

- [ ] Downloads API works correctly
- [ ] File naming works (no special characters issues)
- [ ] Blob URLs work correctly
- [ ] Message passing works between scripts

---

## Browser Compatibility Tests

### Chrome

- [ ] Version: ___________
- [ ] All features work
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance acceptable

### Firefox

- [ ] Version: ___________
- [ ] All features work
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance acceptable

### Edge

- [ ] Version: ___________
- [ ] All features work
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance acceptable

---

## Integration Tests

### Theme + Export

- [ ] Export works with dark theme applied
- [ ] Export works with custom theme applied
- [ ] Export works with custom fonts applied
- [ ] Export works with cover image applied

### Multiple Tabs

- [ ] Export works correctly in multiple tabs
- [ ] Format preference syncs across tabs
- [ ] No conflicts between simultaneous exports

### Settings Persistence

- [ ] Export format persists after browser restart
- [ ] Export format syncs with theme settings
- [ ] All settings coexist without conflicts

---

## Security Tests

### Data Privacy

- [ ] Exported data only includes public information
- [ ] No sensitive user data leaked
- [ ] No authentication tokens in exports

### Permissions

- [ ] Extension only requests necessary permissions
- [ ] Downloads permission is used correctly
- [ ] No unnecessary host permissions

### Content Security

- [ ] No XSS vulnerabilities in export data
- [ ] User input is properly sanitized
- [ ] File downloads are secure

---

## Regression Tests

After any code changes, verify:

- [ ] Existing themes still work
- [ ] Font customization still works
- [ ] Cover images still work
- [ ] Export still works
- [ ] Popup UI remains functional
- [ ] Options page remains functional
- [ ] No new console errors
- [ ] No performance degradation

---

## Test Results Template

### Test Session Information

- **Date**: ___________
- **Tester**: ___________
- **Extension Version**: ___________
- **Browser**: ___________
- **OS**: ___________

### Summary

- **Total Tests**: ___________
- **Passed**: ___________
- **Failed**: ___________
- **Skipped**: ___________

### Failed Tests

List any failed tests with details:

1. **Test Name**: ___________
   - **Expected**: ___________
   - **Actual**: ___________
   - **Steps to Reproduce**: ___________
   - **Screenshots**: ___________

### Notes

Additional observations or comments:

---

## Automated Testing (Future)

Consider implementing automated tests for:

- Unit tests for data extraction functions
- Unit tests for serialization functions
- Integration tests for message passing
- End-to-end tests for complete export flow
- Performance benchmarks
- Memory leak detection

---

**Last Updated**: 2024-01-15
**Maintained by**: @MarkusGarantor
