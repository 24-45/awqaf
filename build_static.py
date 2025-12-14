#!/usr/bin/env python3
"""
Build static HTML files for GitHub Pages deployment.
This script renders Jinja2 templates to static HTML files.
"""

import os
import shutil
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# Configuration
PROJECT_ROOT = Path(__file__).parent
TEMPLATES_DIR = PROJECT_ROOT / 'templates'
STATIC_DIR = PROJECT_ROOT / 'static'
OUTPUT_DIR = PROJECT_ROOT / 'docs'

def build_static_site():
    """Build the static site in the docs folder."""
    
    # Create output directory
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)
    
    # Setup Jinja2 environment
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))
    
    # Add url_for function for static files (GitHub Pages compatible)
    def url_for(endpoint, **kwargs):
        if endpoint == 'static':
            filename = kwargs.get('filename', '')
            return f'static/{filename}'
        return ''
    
    env.globals['url_for'] = url_for
    
    # Pages to render
    pages = [
        ('index.html', 'index.html'),
        ('executive_summary_report.html', 'executive-summary.html'),
        ('digital_performance_report.html', 'digital-performance-report.html'),
        ('media_performance_report.html', 'media-performance-report.html'),
        ('media_image_report.html', 'media-image-report.html'),
        ('full_report_pdf.html', 'full-report-pdf.html'),
    ]
    
    # Render each page
    for template_name, output_name in pages:
        print(f'Rendering {template_name} -> {output_name}')
        try:
            template = env.get_template(template_name)
            html_content = template.render()
            
            # Fix navigation links for static site
            html_content = html_content.replace("window.location.href = '/'", "window.location.href = 'index.html'")
            html_content = html_content.replace("window.location.href = '/executive-summary'", "window.location.href = 'executive-summary.html'")
            html_content = html_content.replace("window.location.href = '/digital-performance-report'", "window.location.href = 'digital-performance-report.html'")
            html_content = html_content.replace("window.location.href = '/media-performance-report'", "window.location.href = 'media-performance-report.html'")
            html_content = html_content.replace("window.location.href = '/media-image-report'", "window.location.href = 'media-image-report.html'")
            html_content = html_content.replace("window.location.href = '/full-report-pdf'", "window.location.href = 'full-report-pdf.html'")
            
            # Write output file
            output_path = OUTPUT_DIR / output_name
            output_path.write_text(html_content, encoding='utf-8')
            print(f'  ✓ Created {output_path}')
        except Exception as e:
            print(f'  ✗ Error rendering {template_name}: {e}')
    
    # Copy static files
    print('\nCopying static files...')
    static_output = OUTPUT_DIR / 'static'
    if STATIC_DIR.exists():
        shutil.copytree(STATIC_DIR, static_output)
        print(f'  ✓ Copied static folder to {static_output}')
    
    # Create .nojekyll file for GitHub Pages
    nojekyll_path = OUTPUT_DIR / '.nojekyll'
    nojekyll_path.touch()
    print(f'  ✓ Created .nojekyll file')
    
    print(f'\n✅ Static site built successfully in: {OUTPUT_DIR}')
    print('\nNext steps:')
    print('1. Commit and push changes to GitHub')
    print('2. Go to repository Settings > Pages')
    print('3. Set Source to "Deploy from a branch"')
    print('4. Select "main" branch and "/docs" folder')
    print('5. Save and wait for deployment')

if __name__ == '__main__':
    build_static_site()
