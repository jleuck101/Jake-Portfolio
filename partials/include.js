async function loadHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
  
    // Resolve URLs relative to THIS script file, not the current page.
    const scriptUrl = new URL(document.currentScript.src);
    const partialsDir = new URL("./", scriptUrl);          // .../partials/
    const siteRoot = new URL("../", partialsDir);          // .../ (repo/site root)
    const headerUrl = new URL("header.html", partialsDir); // .../partials/header.html
  
    try {
      const res = await fetch(headerUrl.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`Header fetch failed: ${res.status}`);
  
      host.innerHTML = await res.text();
  
      // Rewrite internal links in the injected header so they work from /projects/* too.
      host.querySelectorAll("a[href]").forEach(a => {
        const href = a.getAttribute("href");
        if (!href) return;
  
        // Ignore anchors, external links, mailto, tel, etc.
        if (
          href.startsWith("#") ||
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        ) return;
  
        // Make it absolute to the site root (which respects GitHub Pages subpaths)
        a.setAttribute("href", new URL(href, siteRoot).toString());
      });
  
    } catch (err) {
      // Fail silently (no ugly 404 HTML injected)
      host.innerHTML = "";
      console.warn(err);
    }
  }
  
  loadHeader();
  