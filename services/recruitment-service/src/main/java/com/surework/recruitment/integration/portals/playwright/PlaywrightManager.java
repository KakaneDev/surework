package com.surework.recruitment.integration.portals.playwright;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.Position;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Random;

/**
 * Manages Playwright browser instances for portal automation.
 * Implements stealth techniques to reduce bot detection.
 */
@Component
public class PlaywrightManager {

    private static final Logger log = LoggerFactory.getLogger(PlaywrightManager.class);
    private static final Random random = new Random();

    @Value("${portal.automation.headless:false}")
    private boolean headless;

    @Value("${portal.automation.slow-mo:100}")
    private int slowMo;

    @Value("${portal.automation.screenshots-dir:./screenshots}")
    private String screenshotsDir;

    @Value("${portal.automation.user-data-dir:./browser-data}")
    private String userDataDir;

    private volatile Playwright playwright;
    private volatile BrowserType browserType;
    private volatile boolean initialized = false;
    private final Object lock = new Object();

    // Realistic user agents for major browsers
    private static final List<String> USER_AGENTS = List.of(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
    );

    // Realistic viewports
    private static final List<ViewportSize> VIEWPORTS = List.of(
            new ViewportSize(1920, 1080),
            new ViewportSize(1536, 864),
            new ViewportSize(1440, 900),
            new ViewportSize(1366, 768)
    );

    @PostConstruct
    public void postConstruct() {
        log.info("PlaywrightManager created - browser will be initialized on first use");
    }

    /**
     * Lazily initialize Playwright on first use.
     */
    private void ensureInitialized() {
        if (!initialized) {
            synchronized (lock) {
                if (!initialized) {
                    log.info("Initializing Playwright (lazy)...");
                    playwright = Playwright.create();
                    browserType = playwright.chromium();
                    initialized = true;
                    log.info("Playwright initialized successfully");
                }
            }
        }
    }

    @PreDestroy
    public void shutdown() {
        if (initialized && playwright != null) {
            log.info("Shutting down Playwright...");
            playwright.close();
            log.info("Playwright shutdown complete");
        }
    }

    /**
     * Create a new browser context with stealth settings.
     *
     * @param portalName Name of the portal (for session persistence)
     * @return A configured browser context
     */
    public BrowserContext createContext(String portalName) {
        ensureInitialized();
        Browser browser = browserType.launch(new BrowserType.LaunchOptions()
                .setHeadless(headless)
                .setSlowMo(slowMo)
                .setArgs(List.of(
                        "--disable-blink-features=AutomationControlled",
                        "--disable-dev-shm-usage",
                        "--no-sandbox"
                ))
        );

        String userAgent = USER_AGENTS.get(random.nextInt(USER_AGENTS.size()));
        ViewportSize viewport = VIEWPORTS.get(random.nextInt(VIEWPORTS.size()));

        BrowserContext context = browser.newContext(new Browser.NewContextOptions()
                .setUserAgent(userAgent)
                .setViewportSize(viewport.width(), viewport.height())
                .setLocale("en-ZA")
                .setTimezoneId("Africa/Johannesburg")
                .setGeolocation(-26.2041, 28.0473) // Johannesburg coordinates
                .setPermissions(List.of("geolocation"))
        );

        // Add stealth scripts to every page
        context.addInitScript(getStealthScript());

        return context;
    }

    /**
     * Create a new page in the given context.
     *
     * @param context The browser context
     * @return A configured page
     */
    public Page createPage(BrowserContext context) {
        Page page = context.newPage();

        // Handle dialogs automatically
        page.onDialog(dialog -> {
            log.debug("Dialog appeared: {} - {}", dialog.type(), dialog.message());
            dialog.accept();
        });

        // Log console messages for debugging
        page.onConsoleMessage(msg -> {
            if ("error".equals(msg.type())) {
                log.warn("Browser console error: {}", msg.text());
            }
        });

        return page;
    }

    /**
     * Take a screenshot for debugging purposes.
     *
     * @param page The page to screenshot
     * @param name Name for the screenshot file
     */
    public void takeScreenshot(Page page, String name) {
        Path path = Paths.get(screenshotsDir, name + "_" + System.currentTimeMillis() + ".png");
        page.screenshot(new Page.ScreenshotOptions().setPath(path).setFullPage(true));
        log.info("Screenshot saved: {}", path);
    }

    /**
     * Add human-like delay between actions.
     *
     * @param minMs Minimum delay in milliseconds
     * @param maxMs Maximum delay in milliseconds
     */
    public void humanDelay(int minMs, int maxMs) {
        try {
            int delay = minMs + random.nextInt(maxMs - minMs);
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Type text with human-like delays between keystrokes.
     *
     * @param page The page
     * @param selector The input selector
     * @param text The text to type
     */
    public void humanType(Page page, String selector, String text) {
        page.click(selector);
        humanDelay(100, 300);

        for (char c : text.toCharArray()) {
            page.keyboard().press(String.valueOf(c));
            humanDelay(50, 150);
        }
    }

    /**
     * Click an element with human-like behavior.
     *
     * @param page The page
     * @param selector The element selector
     */
    public void humanClick(Page page, String selector) {
        humanDelay(200, 500);

        // Scroll element into view
        page.locator(selector).scrollIntoViewIfNeeded();
        humanDelay(100, 300);

        // Click with slight randomization
        page.locator(selector).click(new Locator.ClickOptions()
                .setPosition(new Position(
                        5 + random.nextDouble() * 5,
                        5 + random.nextDouble() * 5
                ))
        );
    }

    /**
     * Wait for page to be fully loaded.
     *
     * @param page The page
     */
    public void waitForPageLoad(Page page) {
        page.waitForLoadState(LoadState.NETWORKIDLE);
        humanDelay(500, 1000);
    }

    /**
     * Check if a CAPTCHA is present on the page.
     *
     * @param page The page to check
     * @return true if a CAPTCHA is detected
     */
    public boolean hasCaptcha(Page page) {
        // Check for common CAPTCHA indicators
        return page.locator("[class*='captcha']").count() > 0 ||
                page.locator("[class*='recaptcha']").count() > 0 ||
                page.locator("iframe[src*='captcha']").count() > 0 ||
                page.locator("iframe[src*='recaptcha']").count() > 0 ||
                page.content().toLowerCase().contains("verify you are human") ||
                page.content().toLowerCase().contains("i'm not a robot");
    }

    /**
     * JavaScript to make browser appear more human-like.
     */
    private String getStealthScript() {
        return """
            // Mask webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            // Add plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
                    { name: 'Chrome PDF Viewer', description: 'Portable Document Format' },
                    { name: 'Native Client', description: 'Native Client Executable' }
                ]
            });

            // Add languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-ZA', 'en-US', 'en']
            });

            // Mask automation indicators
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );

            // Add chrome object
            window.chrome = {
                runtime: {}
            };
            """;
    }

    /**
     * Viewport size record.
     */
    private record ViewportSize(int width, int height) {}

}
