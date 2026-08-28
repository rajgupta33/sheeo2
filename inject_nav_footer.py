import re

def main():
    with open('index.html', 'r', encoding='utf-8') as f:
        main_html = f.read()

    # Extract nav
    nav_match = re.search(r'(<nav class="navbar">.*?</nav>)', main_html, re.DOTALL)
    if not nav_match:
        print("Nav not found")
        return
    nav_content = nav_match.group(1)

    # Extract footer
    footer_match = re.search(r'(<footer class="site-footer bg-cream">.*?</footer>)', main_html, re.DOTALL)
    if not footer_match:
        print("Footer not found")
        return
    footer_content = footer_match.group(1)

    # Extract scripts at the end of body in main index.html
    # script_match = re.search(r'(<script>.*?</script>\s*<script src="/script.js"></script>)', main_html, re.DOTALL)
    # Actually just append <script src="/script.js"></script>

    # Read SABR index.html
    sabr_path = 'directory/sabr-family/index.disabled.html'
    with open(sabr_path, 'r', encoding='utf-8') as f:
        sabr_html = f.read()

    # Inject nav after <body ...>
    sabr_html = re.sub(r'(<body[^>]*>)', r'\1\n' + nav_content, sabr_html)

    # Inject footer and script before </body>
    script_content = '<script src="/script.js"></script>'
    sabr_html = re.sub(r'(</body>)', footer_content + '\n' + script_content + '\n' + r'\1', sabr_html)

    with open(sabr_path, 'w', encoding='utf-8') as f:
        f.write(sabr_html)
    
    print("Successfully injected nav and footer.")

if __name__ == '__main__':
    main()
