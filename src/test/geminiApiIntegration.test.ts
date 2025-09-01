})
      });

      const result = await generateWebsite(mockWebsiteRequest);

      // Should return empty strings for malformed content
      expect(result.html).toBe('');
      expect(result.css).toBe('');
      expect(result.js).toBe('');
    });
  });
});