import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Book, Chapter, ExportPreset, ExportFormat } from '@/types';
import { countWords } from '@/utils/factories';

// ---------------------------------------------------------------------------
// PDF Export — professional book formatting
// ---------------------------------------------------------------------------

export function exportPDF(book: Book, chapters: Chapter[], preset: ExportPreset): void {
  const pageWidth = preset.width * 72; // points (1 inch = 72pt)
  const pageHeight = preset.height * 72;
  const margin = {
    top: preset.marginTop * 72,
    bottom: preset.marginBottom * 72,
    left: preset.marginLeft * 72,
    right: preset.marginRight * 72,
  };
  const contentWidth = pageWidth - margin.left - margin.right;
  const fontSize = preset.fontSize;
  const lineHeight = fontSize * preset.lineHeight;

  const doc = new jsPDF({
    unit: 'pt',
    format: [pageWidth, pageHeight],
    orientation: 'portrait',
  });

  doc.setFont('times', 'normal');
  let y = margin.top;
  let pageNum = 1;

  function addPageBreak() {
    if (preset.includePageNumbers) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      const pageStr = String(pageNum);
      const textWidth = doc.getTextWidth(pageStr);
      doc.text(pageStr, pageWidth / 2 - textWidth / 2, pageHeight - margin.bottom / 2);
      doc.setTextColor(0);
    }
    doc.addPage();
    y = margin.top;
    pageNum++;
  }

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - margin.bottom) {
      addPageBreak();
    }
  }

  function writeText(text: string, opts?: { bold?: boolean; italic?: boolean; size?: number; align?: 'left' | 'center' | 'right' }) {
    const size = opts?.size || fontSize;
    const bold = opts?.bold;
    const italic = opts?.italic;
    doc.setFontSize(size);
    if (bold && italic) doc.setFont('times', 'bolditalic');
    else if (bold) doc.setFont('times', 'bold');
    else if (italic) doc.setFont('times', 'italic');
    else doc.setFont('times', 'normal');
    doc.setTextColor(0);

    const align = opts?.align || 'left';
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin.right : margin.left;

    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    for (const line of lines) {
      ensureSpace(size * 1.5);
      if (align === 'center') {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, pageWidth / 2 - textWidth / 2, y);
      } else {
        doc.text(line, x, y);
      }
      y += size * 1.5;
    }
  }

  function writeHtmlContent(html: string) {
    // Parse simple HTML and render as formatted text
    const container = document.createElement('div');
    container.innerHTML = html;

    for (const node of container.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          writeText(text);
          y += lineHeight * 0.3;
        }
        continue;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const text = el.textContent || '';

      switch (tag) {
        case 'h1':
        case 'h2':
          y += lineHeight * 0.5;
          writeText(text, { bold: true, size: fontSize * 1.4, align: 'center' });
          y += lineHeight * 0.5;
          break;
        case 'h3':
          y += lineHeight * 0.3;
          writeText(text, { bold: true, size: fontSize * 1.2 });
          y += lineHeight * 0.3;
          break;
        case 'blockquote': {
          doc.setFont('times', 'italic');
          const quoteLines = doc.splitTextToSize(text, contentWidth - 40) as string[];
          for (const line of quoteLines) {
            ensureSpace(lineHeight);
            doc.text(line, margin.left + 20, y);
            y += lineHeight;
          }
          doc.setFont('times', 'normal');
          y += lineHeight * 0.3;
          break;
        }
        case 'p':
          writeText(text);
          y += lineHeight * 0.3;
          break;
        case 'ul':
        case 'ol': {
          const items = el.querySelectorAll('li');
          items.forEach((item, idx) => {
            const prefix = tag === 'ol' ? `${idx + 1}. ` : '• ';
            writeText(prefix + (item.textContent || ''));
          });
          y += lineHeight * 0.3;
          break;
        }
        default:
          if (text.trim()) {
            writeText(text);
            y += lineHeight * 0.3;
          }
      }
    }
  }

  // --- Title Page ---
  if (preset.includeTitlePage) {
    y = pageHeight * 0.35;
    writeText(book.title, { bold: true, size: 28, align: 'center' });
    y += 20;
    if (book.author) {
      writeText(book.author, { size: 16, align: 'center' });
    }
    addPageBreak();
  }

  // --- Copyright Page ---
  if (preset.includeCopyright) {
    y = pageHeight * 0.5;
    writeText(`© ${new Date().getFullYear()} ${book.author}`, { size: 10, align: 'center' });
    y += 14;
    writeText('All rights reserved.', { size: 10, align: 'center' });
    y += 14;
    writeText('No part of this book may be reproduced without written permission from the author.', { size: 10, align: 'center' });
    addPageBreak();
  }

  // --- Table of Contents ---
  if (preset.includeTOC) {
    y = margin.top;
    writeText('Table of Contents', { bold: true, size: 20, align: 'center' });
    y += 30;
    for (const ch of chapters) {
      if (ch.content.trim()) {
        writeText(`Chapter ${ch.number}: ${ch.title}`);
      }
    }
    addPageBreak();
  }

  // --- Chapters ---
  for (const ch of chapters) {
    if (!ch.content.trim()) continue;

    // Chapter title page or heading
    y += lineHeight;
    writeText(`Chapter ${ch.number}`, { bold: true, size: 18, align: 'center' });
    y += 8;
    writeText(ch.title, { italic: true, size: 14, align: 'center' });
    y += lineHeight;

    // Chapter content
    writeHtmlContent(ch.content);

    addPageBreak();
  }

  // Final page numbers
  if (preset.includePageNumbers) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    const pageStr = String(pageNum);
    const textWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth / 2 - textWidth / 2, pageHeight - margin.bottom / 2);
  }

  doc.save(`${sanitizeFilename(book.title)}.pdf`);
}

// ---------------------------------------------------------------------------
// DOCX Export — using JSZip to build a valid .docx package
// ---------------------------------------------------------------------------

function htmlToDocXParagraphs(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;
  const paragraphs: string[] = [];

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        paragraphs.push(`<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`);
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'h1':
        paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(el.textContent || '')}</w:t></w:r></w:p>`);
        break;
      case 'h2':
        paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(el.textContent || '')}</w:t></w:r></w:p>`);
        break;
      case 'h3':
        paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(el.textContent || '')}</w:t></w:r></w:p>`);
        break;
      case 'blockquote': {
        const inner = el.innerHTML;
        const blockquoteParas = innerToParagraphs(inner);
        for (const bp of blockquoteParas) {
          paragraphs.push(`<w:p><w:pPr><w:ind w:left="720"/><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:i/></w:rPr>${bp}</w:r></w:p>`);
        }
        break;
      }
      case 'p': {
        const runs = processInline(el);
        paragraphs.push(`<w:p><w:pPr><w:spacing w:after="200"/></w:pPr>${runs}</w:p>`);
        break;
      }
      case 'ul': {
        const items = el.querySelectorAll(':scope > li');
        items.forEach((li) => {
          const runs = processInline(li);
          paragraphs.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${runs}</w:p>`);
        });
        break;
      }
      case 'ol': {
        const items = el.querySelectorAll(':scope > li');
        items.forEach((li) => {
          const runs = processInline(li);
          paragraphs.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>${runs}</w:p>`);
        });
        break;
      }
      case 'br':
        paragraphs.push('<w:p/>');
        break;
      default:
        // For unknown block elements, try processing children
        for (const child of el.childNodes) {
          processNode(child);
        }
    }
  }

  function processInline(el: Element): string {
    let runs = '';
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text) {
          runs += `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as HTMLElement;
        const childTag = childEl.tagName.toLowerCase();
        const innerText = childEl.textContent || '';
        if (childTag === 'strong' || childTag === 'b') {
          runs += `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(innerText)}</w:t></w:r>`;
        } else if (childTag === 'em' || childTag === 'i') {
          runs += `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${escapeXml(innerText)}</w:t></w:r>`;
        } else if (childTag === 'u') {
          runs += `<w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${escapeXml(innerText)}</w:t></w:r>`;
        } else if (childTag === 'br') {
          runs += '<w:r><w:br/></w:r>';
        } else {
          runs += `<w:r><w:t xml:space="preserve">${escapeXml(innerText)}</w:t></w:r>`;
        }
      }
    }
    return runs;
  }

  function innerToParagraphs(html: string): string[] {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const result: string[] = [];
    for (const child of tempDiv.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text.trim()) {
          result.push(`<w:t xml:space="preserve">${escapeXml(text)}</w:t>`);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        result.push(`<w:t xml:space="preserve">${escapeXml(el.textContent || '')}</w:t>`);
      }
    }
    return result;
  }

  for (const child of container.childNodes) {
    processNode(child);
  }

  return paragraphs.join('\n');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function exportDOCX(book: Book, chapters: Chapter[], preset: ExportPreset): Promise<void> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

  // _rels/.rels
  zip.folder('_rels')!.file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  // word/_rels/document.xml.rels
  zip.folder('word')!.folder('_rels')!.file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`);

  // docProps/core.xml
  zip.folder('docProps')!.file('core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(book.title)}</dc:title>
  <dc:creator>${escapeXml(book.author)}</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`);

  // docProps/app.xml
  zip.folder('docProps')!.file('app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>AI Book Studio</Application>
</Properties>`);

  // word/numbering.xml
  zip.folder('word')!.file('numbering.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`);

  // word/styles.xml
  zip.folder('word')!.file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="200" w:line="360" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:spacing w:before="400" w:after="200"/><w:jc w:val="center"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr><w:spacing w:before="300" w:after="160"/><w:jc w:val="center"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
</w:styles>`);

  // word/document.xml
  const bodyParts: string[] = [];

  // Title page
  if (preset.includeTitlePage) {
    bodyParts.push(`<w:p><w:pPr><w:spacing w:before="4000" w:after="400"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="56"/><w:szCs w:val="56"/></w:rPr><w:t xml:space="preserve">${escapeXml(book.title)}</w:t></w:r></w:p>`);
    if (book.author) {
      bodyParts.push(`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">${escapeXml(book.author)}</w:t></w:r></w:p>`);
    }
    bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  }

  // Copyright page
  if (preset.includeCopyright) {
    bodyParts.push(`<w:p><w:pPr><w:spacing w:before="3000"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${escapeXml('© ' + new Date().getFullYear() + ' ' + book.author)}</w:t></w:r></w:p>`);
    bodyParts.push(`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">All rights reserved.</w:t></w:r></w:p>`);
    bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></p>');
  }

  // Table of Contents
  if (preset.includeTOC) {
    bodyParts.push(`<w:p><w:pPr><w:spacing w:after="400"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="40"/></w:rPr><w:t xml:space="preserve">Table of Contents</w:t></w:r></w:p>`);
    for (const ch of chapters) {
      if (ch.content.trim()) {
        bodyParts.push(`<w:p><w:r><w:t xml:space="preserve">${escapeXml('Chapter ' + ch.number + ': ' + ch.title)}</w:t></w:r></w:p>`);
      }
    }
    bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  }

  // Chapters
  for (const ch of chapters) {
    if (!ch.content.trim()) continue;
    bodyParts.push(`<w:p><w:pPr><w:spacing w:before="400" w:after="100"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t xml:space="preserve">${escapeXml('Chapter ' + ch.number)}</w:t></w:r></w:p>`);
    bodyParts.push(`<w:p><w:pPr><w:spacing w:after="400"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve">${escapeXml(ch.title)}</w:t></w:r></w:p>`);
    bodyParts.push(htmlToDocXParagraphs(ch.content));
    bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${bodyParts.join('\n')}
<w:sectPr><w:pgSz w:w="${Math.round(preset.width * 1440)}" w:h="${Math.round(preset.height * 1440)}"/><w:pgMar w:top="${Math.round(preset.marginTop * 1440)}" w:bottom="${Math.round(preset.marginBottom * 1440)}" w:left="${Math.round(preset.marginLeft * 1440)}" w:right="${Math.round(preset.marginRight * 1440)}"/></w:sectPr>
</w:body>
</w:document>`;

  zip.folder('word')!.file('document.xml', documentXml);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `${sanitizeFilename(book.title)}.docx`);
}

// ---------------------------------------------------------------------------
// EPUB Export — valid EPUB 3 structure
// ---------------------------------------------------------------------------

export async function exportEPUB(book: Book, chapters: Chapter[], preset: ExportPreset): Promise<void> {
  const zip = new JSZip();

  // mimetype (must be first, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // META-INF/container.xml
  zip.folder('META-INF')!.file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // OEBPS/content.opf
  const chapterItems = chapters.filter((c) => c.content.trim());
  const manifestItems = chapterItems.map((ch) => 
    `<item id="chap${ch.number}" href="chapter${ch.number}.xhtml" media-type="application/xhtml+xml"/>`
  ).join('\n    ');

  const spineItems = chapterItems.map((ch) => 
    `<itemref idref="chap${ch.number}"/>`
  ).join('\n    ');

  const navItems = chapterItems.map((ch) => 
    `<li><a href="chapter${ch.number}.xhtml">Chapter ${ch.number}: ${escapeXml(ch.title)}</a></li>`
  ).join('\n      ');

  const coverItem = preset.includeCover && book.coverDataUrl ? 
    `<item id="cover-image" href="cover-image.jpg" media-type="image/jpeg"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>` : '';
  const coverSpine = preset.includeCover && book.coverDataUrl ? '<itemref idref="cover"/>' : '';

  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">ai-book-studio-${book.id}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>${escapeXml(book.language || 'en')}</dc:language>
    <dc:description>${escapeXml(book.metadata.longDescription || book.metadata.shortDescription || book.idea)}</dc:description>
    ${book.metadata.keywords.map((k) => `<dc:subject>${escapeXml(k)}</dc:subject>`).join('\n    ')}
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${coverItem}
    <item id="css" href="style.css" media-type="text/css"/>
    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>
    ${manifestItems}
  </manifest>
  <spine>
    ${coverSpine}
    <itemref idref="titlepage"/>
    <itemref idref="nav"/>
    ${spineItems}
  </spine>
</package>`;

  zip.folder('OEBPS')!.file('content.opf', opfContent);

  // OEBPS/style.css
  zip.folder('OEBPS')!.file('style.css', `body { font-family: Georgia, serif; line-height: 1.6; margin: 5% 8%; text-align: justify; }
h1, h2 { text-align: center; font-weight: bold; }
h1 { font-size: 1.8em; margin-top: 2em; }
h2 { font-size: 1.4em; }
blockquote { margin: 1em 2em; font-style: italic; border-left: 3px solid #ccc; padding-left: 1em; }
p { margin-bottom: 1em; text-indent: 1.5em; }
p:first-child { text-indent: 0; }
.title-page { text-align: center; margin-top: 30%; }
.title-page h1 { font-size: 2.5em; }
.title-page p { font-size: 1.2em; text-indent: 0; }
.cover { width: 100%; height: 100%; }
img { max-width: 100%; }`);

  // OEBPS/nav.xhtml
  zip.folder('OEBPS')!.file('nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="utf-8"/><title>Table of Contents</title><link rel="stylesheet" href="style.css"/></head>
<body>
<nav epub:type="toc" id="toc">
<h1>Table of Contents</h1>
<ol>
      ${navItems}
</ol>
</nav>
</body>
</html>`);

  // OEBPS/titlepage.xhtml
  zip.folder('OEBPS')!.file('titlepage.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"/><title>${escapeXml(book.title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
<div class="title-page">
<h1>${escapeXml(book.title)}</h1>
<p>${escapeXml(book.author)}</p>
</div>
</body>
</html>`);

  // Cover image
  if (preset.includeCover && book.coverDataUrl) {
    try {
      const base64Data = book.coverDataUrl.split(',')[1] || '';
      zip.folder('OEBPS')!.file('cover-image.jpg', base64Data, { base64: true });
      zip.folder('OEBPS')!.file('cover.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"/><title>Cover</title><link rel="stylesheet" href="style.css"/></head>
<body>
<div class="cover"><img src="cover-image.jpg" alt="${escapeXml(book.title)}"/></div>
</body>
</html>`);
    } catch {
      // Skip cover if image data is invalid
    }
  }

  // Chapter files
  for (const ch of chapterItems) {
    const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"/><title>Chapter ${ch.number}: ${escapeXml(ch.title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
<h1>Chapter ${ch.number}</h1>
<h2>${escapeXml(ch.title)}</h2>
${cleanHtmlForEpub(ch.content)}
</body>
</html>`;
    zip.folder('OEBPS')!.file(`chapter${ch.number}.xhtml`, chapterHtml);
  }

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  saveAs(blob, `${sanitizeFilename(book.title)}.epub`);
}

function cleanHtmlForEpub(html: string): string {
  // Basic cleanup — ensure valid XHTML
  return html
    .replace(/<br>/g, '<br/>')
    .replace(/<hr>/g, '<hr/>')
    .replace(/<img([^>]*?)>/g, '<img$1/>');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 80) || 'book';
}

export function getExportPreset(format: ExportFormat | 'all'): ExportPreset[] {
  const presets: ExportPreset[] = [
    { id: 'kdp-paperback', name: 'Amazon KDP Paperback', format: 'pdf', pageSize: '6x9', width: 6, height: 9, marginTop: 0.875, marginBottom: 0.875, marginLeft: 0.625, marginRight: 0.625, fontSize: 11, lineHeight: 1.5, includeTitlePage: true, includeCopyright: true, includeTOC: true, includePageNumbers: true, includeCover: false },
    { id: 'kdp-ebook', name: 'Amazon KDP Ebook', format: 'epub', pageSize: '6x9', width: 6, height: 9, marginTop: 0.5, marginBottom: 0.5, marginLeft: 0.5, marginRight: 0.5, fontSize: 12, lineHeight: 1.6, includeTitlePage: true, includeCopyright: true, includeTOC: true, includePageNumbers: false, includeCover: true },
    { id: 'standard-ebook', name: 'Standard Ebook', format: 'epub', pageSize: '6x9', width: 6, height: 9, marginTop: 0.6, marginBottom: 0.6, marginLeft: 0.6, marginRight: 0.6, fontSize: 12, lineHeight: 1.6, includeTitlePage: true, includeCopyright: true, includeTOC: true, includePageNumbers: false, includeCover: true },
    { id: '5x8', name: '5 x 8 inch', format: 'pdf', pageSize: '5x8', width: 5, height: 8, marginTop: 0.75, marginBottom: 0.75, marginLeft: 0.5, marginRight: 0.5, fontSize: 10, lineHeight: 1.5, includeTitlePage: true, includeCopyright: true, includeTOC: true, includePageNumbers: true, includeCover: false },
    { id: '5.5x8.5', name: '5.5 x 8.5 inch', format: 'pdf', pageSize: '5.5x8.5', width: 5.5, height: 8.5, marginTop: 0.75, marginBottom: 0.75, marginLeft: 0.5, marginRight: 0.5, fontSize: 10, lineHeight: 1.5, includeTitlePage: true, includeCopyright: true, includeTOC: true, includePageNumbers: true, includeCover: false },
    { id: '6x9', name: '6 x 9 inch', format: 'pdf', pageSize: '6x9', width: 6, height: 9, marginTop: 0.875, marginBottom: 0.875, marginLeft: 0.625, marginRight: 0.625, fontSize: 11, lineHeight: 1.5, includeTitlePage: true, includeCopyright: true, includeTOC: true, includePageNumbers: true, includeCover: false },
    { id: 'docx-standard', name: 'Standard Manuscript (DOCX)', format: 'docx', pageSize: '8.5x11', width: 8.5, height: 11, marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1, fontSize: 12, lineHeight: 1.5, includeTitlePage: true, includeCopyright: true, includeTOC: true, includePageNumbers: false, includeCover: false },
  ];
  if (format === 'all') return presets;
  return presets.filter((p) => p.format === format);
}

// ---------------------------------------------------------------------------
// Project backup export/import (.bookstudio format)
// ---------------------------------------------------------------------------

export async function exportProjectFile(book: Book): Promise<void> {
  const { exportProject } = await import('./db');
  const backup = await exportProject(book.id);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  saveAs(blob, `${sanitizeFilename(book.title)}.bookstudio`);
}

export async function importProjectFile(file: File): Promise<string> {
  const text = await file.text();
  const backup = JSON.parse(text);
  const { importProject } = await import('./db');
  return importProject(backup);
}

// Re-export countWords for convenience
export { countWords };
