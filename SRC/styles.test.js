// SRC/styles.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { injectStyles } from './styles.js'; // Assuming styles.js exports this

// Mock Lampa Template and jQuery ($) methods
let mockTemplateAdd;
let mockTemplateGet;
let mockJquery;
// Use separate mock instances for different jQuery results
let mockJqueryResultStyleCheck;
let mockJqueryResultBody;
let mockBodyAppend;


describe('Styles Injection (styles.js)', () => {

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Define fresh mocks
        mockTemplateAdd = vi.fn();
        mockTemplateGet = vi.fn(() => '<div>Mock Style Content</div>'); // get needs to return something appendable
        mockBodyAppend = vi.fn(); // Mock for the append method

        // Mock jQuery instances
        mockJqueryResultStyleCheck = { length: 0 }; // Default: style doesn't exist
        mockJqueryResultBody = { append: mockBodyAppend };

        // Mock the main $ function to return different results based on selector
        mockJquery = vi.fn((selector) => {
            if (typeof selector === 'string' && selector.startsWith('style[data-id=')) {
                return mockJqueryResultStyleCheck;
            }
            if (selector === 'body') {
                return mockJqueryResultBody;
            }
            // Return a generic mock object for other selectors if needed
            return { length: 0, append: vi.fn(), find: vi.fn().mockReturnThis() /* etc */ };
        });

        // Assign mocks to window
        window.Lampa = {
            Template: {
                add: mockTemplateAdd,
                get: mockTemplateGet
            }
            // Add other Lampa namespaces if needed by styles.js
        };
        window.$ = mockJquery;
    });

    it('should inject styles if they do not already exist', () => {
        // Arrange: Ensure style check returns length 0 (default in beforeEach)
        mockJqueryResultStyleCheck.length = 0;

        // Act
        injectStyles();

        // Assert
        // 1. Check if style existence was checked
        expect(mockJquery).toHaveBeenCalledWith(expect.stringContaining('style[data-id='));
        // 2. Check Lampa.Template interactions
        expect(mockTemplateAdd).toHaveBeenCalledTimes(1);
        expect(mockTemplateAdd).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('<style data-id=')); // Check ID and content partial
        expect(mockTemplateGet).toHaveBeenCalledTimes(1);
        expect(mockTemplateGet).toHaveBeenCalledWith(expect.any(String), {}, true); // Check get args
        // 3. Check append to body
        expect(mockJquery).toHaveBeenCalledWith('body');
        expect(mockBodyAppend).toHaveBeenCalledTimes(1);
        expect(mockBodyAppend).toHaveBeenCalledWith('<div>Mock Style Content</div>'); // Check append arg matches Template.get mock return
    });

    it('should NOT inject styles if they already exist', () => {
        // Arrange: Make style check return length > 0
        mockJqueryResultStyleCheck.length = 1;

        // Act
        injectStyles();

        // Assert
        // 1. Check if style existence was checked
        expect(mockJquery).toHaveBeenCalledWith(expect.stringContaining('style[data-id='));
        // 2. Check Lampa.Template was NOT used
        expect(mockTemplateAdd).not.toHaveBeenCalled();
        expect(mockTemplateGet).not.toHaveBeenCalled();
        // 3. Check append was NOT called
        expect(mockBodyAppend).not.toHaveBeenCalled();
    });

    it('should handle missing Lampa.Template gracefully', () => {
        // Arrange
        window.Lampa.Template = undefined;

        // Act & Assert
        expect(() => injectStyles()).not.toThrow();
        expect(mockJquery).not.toHaveBeenCalled(); // Shouldn't even get to jQuery checks
        expect(mockTemplateAdd).not.toHaveBeenCalled(); // Redundant check
    });

    it('should handle missing jQuery ($) gracefully', () => {
        // Arrange
        window.$ = undefined;

        // Act & Assert
        expect(() => injectStyles()).not.toThrow();
        // Lampa.Template might still be checked
        expect(mockTemplateAdd).not.toHaveBeenCalled();
        expect(mockTemplateGet).not.toHaveBeenCalled();
        expect(mockBodyAppend).not.toHaveBeenCalled(); // append definitely requires $
    });

});

