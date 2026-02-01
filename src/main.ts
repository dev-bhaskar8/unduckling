import { bangs } from "./bang";
import "./global.css";

// Types
interface CustomBang {
  t: string; // trigger
  s: string; // name/description
  u: string; // url template
  d: string; // domain
}

// Custom bangs management
class CustomBangsManager {
  private static STORAGE_KEY = "custom-bangs";
  private static DEFAULT_BANG_KEY = "default-bang";

  static getCustomBangs(): CustomBang[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static saveCustomBangs(customBangs: CustomBang[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customBangs));
  }

  static addCustomBang(bang: CustomBang): void {
    const customBangs = this.getCustomBangs();
    const existingIndex = customBangs.findIndex(b => b.t === bang.t);
    
    if (existingIndex >= 0) {
      customBangs[existingIndex] = bang;
    } else {
      customBangs.push(bang);
    }
    
    this.saveCustomBangs(customBangs);
  }

  static removeCustomBang(trigger: string): void {
    const customBangs = this.getCustomBangs().filter(b => b.t !== trigger);
    this.saveCustomBangs(customBangs);
  }

  static getDefaultBang(): string {
    return localStorage.getItem(this.DEFAULT_BANG_KEY) ?? "g";
  }

  static setDefaultBang(trigger: string): void {
    localStorage.setItem(this.DEFAULT_BANG_KEY, trigger);
  }

  static getAllBangs(): (CustomBang | typeof bangs[0])[] {
    return [...this.getCustomBangs(), ...bangs];
  }
}

function renderSettingsUI() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const customBangs = CustomBangsManager.getCustomBangs();
  const defaultBang = CustomBangsManager.getDefaultBang();
  
  // Get the current site URL and construct the search URL
  const currentOrigin = window.location.origin;
  const searchUrl = `${currentOrigin}?q=%s`;

  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 12px;">
      <div class="content-container">
        <h1>Und*ckling</h1>
        <p><a href="https://unduck.link/">Und*ck</a> and <a href="https://duckduckgo.com/">DuckDuckGo's</a> bangs lacks features. Add the following URL as a custom search engine to your browser to use Und*ckling's fast client-side redirects, including <a href="https://duckduckgo.com/bangs">all DuckDuckGo bangs</a>, custom bangs, and configurable default search engine.</p>
        
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="${searchUrl}"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>

        <div class="settings-section">
          
          <div class="setting-group">
            <label for="default-bang-select">Default Search Engine:</label>
            <select id="default-bang-select" class="setting-input">
              <option value="g" ${defaultBang === "g" ? "selected" : ""}>Google (g)</option>
              <option value="ddg" ${defaultBang === "ddg" ? "selected" : ""}>DuckDuckGo (ddg)</option>
              <option value="b" ${defaultBang === "b" ? "selected" : ""}>Bing (b)</option>
              <option value="y" ${defaultBang === "y" ? "selected" : ""}>Yahoo (y)</option>
              <option value="ec" ${defaultBang === "ec" ? "selected" : ""}>Ecosia (ec)</option>
              ${customBangs.map(bang => 
                `<option value="${bang.t}" ${defaultBang === bang.t ? "selected" : ""}>${bang.s} (${bang.t})</option>`
              ).join("")}
            </select>
          </div>

          <div class="setting-group">
            <label>Custom Bangs:</label>
            <div class="custom-bangs-list">
              ${customBangs.length === 0 ? 
                '<p class="no-bangs">No custom bangs yet. Add one below!</p>' :
                customBangs.map(bang => `
                  <div class="custom-bang-item">
                    <div class="bang-info">
                      <strong>!${bang.t}</strong> - ${bang.s}
                      <div class="bang-url">${bang.u}</div>
                    </div>
                    <button class="delete-bang-btn" data-trigger="${bang.t}">Delete</button>
                  </div>
                `).join("")
              }
            </div>
            
            <div class="add-bang-form">
              <label>Add Custom Bang</label>
              <div class="form-row">
                <input type="text" id="bang-trigger" placeholder="Trigger (e.g., 'gh')" class="form-input" />
                <input type="text" id="bang-name" placeholder="Name (e.g., 'GitHub')" class="form-input" />
              </div>
              <input type="text" id="bang-url" placeholder="URL (direct link or search template with %s)" class="form-input full-width" />
              <button id="add-bang-btn" class="primary-button">Add Bang</button>
            </div>
          </div>
        </div>
        <p class="github-link">
          <a href="https://github.com/dev-bhaskar8/unduckling" target="_blank">View on GitHub</a>
        </p>
      </div>
    </div>
  `;

  setupEventListeners();
}

function setupEventListeners() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  
  // Copy button functionality
  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";
    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  // Default bang selection
  const defaultBangSelect = app.querySelector<HTMLSelectElement>("#default-bang-select")!;
  defaultBangSelect.addEventListener("change", () => {
    CustomBangsManager.setDefaultBang(defaultBangSelect.value);
  });

  // Add custom bang
  const addBangBtn = app.querySelector<HTMLButtonElement>("#add-bang-btn")!;
  const triggerInput = app.querySelector<HTMLInputElement>("#bang-trigger")!;
  const nameInput = app.querySelector<HTMLInputElement>("#bang-name")!;
  const urlInput2 = app.querySelector<HTMLInputElement>("#bang-url")!;

  addBangBtn.addEventListener("click", () => {
    const trigger = triggerInput.value.trim().toLowerCase();
    const name = nameInput.value.trim();
    const url = urlInput2.value.trim();

    if (!trigger || !name || !url) {
      alert("Please fill in all fields");
      return;
    }

    // Smart URL validation - accept both direct URLs and search templates
    let finalUrl = url;
    try {
      // Test if it's a valid URL
      new URL(url.includes("%s") ? url.replace("%s", "test") : url);
      
      // If URL doesn't contain %s, it's a direct link - no modification needed
      // If URL contains %s, it's a search template - no modification needed
      // Both are valid and will be handled smartly in the redirect logic
      
    } catch (error) {
      alert("Please enter a valid URL");
      return;
    }

    const domain = new URL(finalUrl.includes("%s") ? finalUrl.replace("%s", "test") : finalUrl).hostname;

    CustomBangsManager.addCustomBang({
      t: trigger,
      s: name,
      u: finalUrl,
      d: domain
    });

    // Refresh the UI
    renderSettingsUI();
  });

  // Delete custom bangs
  app.querySelectorAll(".delete-bang-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const trigger = (e.target as HTMLButtonElement).dataset.trigger!;
      if (confirm(`Delete custom bang !${trigger}?`)) {
        CustomBangsManager.removeCustomBang(trigger);
        renderSettingsUI();
      }
    });
  });
}

function getBangRedirectUrl(): string | null {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  
  if (!query) {
    renderSettingsUI();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  
  // Check custom bangs first, then default bangs
  const allBangs = CustomBangsManager.getAllBangs();
  const selectedBang = bangCandidate 
    ? allBangs.find((b) => b.t === bangCandidate)
    : allBangs.find((b) => b.t === CustomBangsManager.getDefaultBang());

  // If we have a bang candidate but no matching bang found, use default search with full query
  if (bangCandidate && !selectedBang) {
    const defaultBang = allBangs.find((b) => b.t === CustomBangsManager.getDefaultBang());
    if (defaultBang) {
      // Use the entire query (including the invalid bang) as the search term
      let searchUrl = defaultBang.u;
      if (searchUrl.includes("%s")) {
        searchUrl = searchUrl.replace("%s", encodeURIComponent(query).replace(/%2F/g, "/"));
      } else if (searchUrl.includes("{{{s}}}")) {
        searchUrl = searchUrl.replace("{{{s}}}", encodeURIComponent(query).replace(/%2F/g, "/"));
      }
      return searchUrl;
    }
  }

  if (!selectedBang) return null;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // Smart redirect logic: handle both direct URLs and search templates
  let searchUrl = selectedBang.u;
  
  // Check if the URL contains search placeholders
  const hasSearchPlaceholder = searchUrl.includes("%s") || searchUrl.includes("{{{s}}}");
  
  if (hasSearchPlaceholder) {
    // This is a search template URL
    if (cleanQuery === "") {
      // If no search term provided, go to the domain homepage
      return `https://${selectedBang.d}`;
    } else {
      // Replace the search placeholder with the actual query
      if (searchUrl.includes("%s")) {
        searchUrl = searchUrl.replace("%s", encodeURIComponent(cleanQuery).replace(/%2F/g, "/"));
      } else if (searchUrl.includes("{{{s}}}")) {
        searchUrl = searchUrl.replace("{{{s}}}", encodeURIComponent(cleanQuery).replace(/%2F/g, "/"));
      }
      return searchUrl;
    }
  } else {
    // This is a direct URL (no search placeholder)
    // Always go to the exact URL regardless of whether there's a search term
    return searchUrl;
  }
}

function doRedirect() {
  const searchUrl = getBangRedirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
