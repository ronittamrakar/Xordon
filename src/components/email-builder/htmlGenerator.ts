import { EmailBlock, GlobalStyles } from './types';

export const generateEmailHtml = (
  blocks: EmailBlock[],
  globalStyles: GlobalStyles,
  subject: string,
  preheader?: string
): string => {
  const blocksHtml = blocks.map(block => generateBlockHtml(block, globalStyles)).join('\n');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    /* Base styles */
    body {
      font-family: ${globalStyles.fontFamily};
      font-size: ${globalStyles.fontSize};
      color: ${globalStyles.textColor};
      background-color: ${globalStyles.backgroundColor};
      margin: 0;
      padding: 0;
    }
    
    .email-container {
      max-width: ${globalStyles.contentWidth};
      margin: 0 auto;
      background-color: ${globalStyles.contentBackgroundColor};
      border-radius: ${globalStyles.borderRadius};
    }
    
    a {
      color: ${globalStyles.linkColor};
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: ${globalStyles.headingColor};
      margin: 0 0 16px 0;
    }
    
    p {
      margin: 0 0 16px 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .responsive-table {
        width: 100% !important;
      }
      
      .mobile-padding {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${globalStyles.backgroundColor};">
  ${preheader ? `
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: ${globalStyles.backgroundColor}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(preheader)}
  </div>
  ` : ''}
  
  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${globalStyles.backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width: ${globalStyles.contentWidth}; width: 100%; background-color: ${globalStyles.contentBackgroundColor}; border-radius: ${globalStyles.borderRadius};">
          ${blocksHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const generateBlockHtml = (block: EmailBlock, globalStyles: GlobalStyles): string => {
  const style = block.style;
  const baseStyle = `
    background-color: ${style.backgroundColor || 'transparent'};
    color: ${style.textColor || globalStyles.textColor};
    font-size: ${style.fontSize || globalStyles.fontSize};
    font-family: ${style.fontFamily || globalStyles.fontFamily};
    text-align: ${style.textAlign || 'left'};
    padding: ${style.padding || '16px'};
    line-height: ${style.lineHeight || '1.5'};
  `.trim();

  switch (block.type) {
    case 'text':
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            ${block.content || ''}
          </td>
        </tr>`;

    case 'heading':
      return `
        <tr>
          <td style="${baseStyle}; font-weight: ${style.fontWeight || 'bold'}; color: ${style.textColor || globalStyles.headingColor};" class="mobile-padding">
            <h2 style="margin: 0; font-size: ${style.fontSize || '24px'}; font-weight: ${style.fontWeight || 'bold'}; color: ${style.textColor || globalStyles.headingColor};">
              ${escapeHtml(block.content || '')}
            </h2>
          </td>
        </tr>`;

    case 'image':
      const img = block.settings?.image;
      const imgHtml = img?.src 
        ? `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || '')}" style="max-width: ${img.width || '100%'}; height: ${img.height || 'auto'}; display: block; margin: 0 auto;" />`
        : '';
      const wrappedImg = img?.link 
        ? `<a href="${escapeHtml(img.link)}" target="_blank">${imgHtml}</a>`
        : imgHtml;
      return `
        <tr>
          <td style="${baseStyle}; text-align: ${img?.alignment || 'center'};" class="mobile-padding">
            ${wrappedImg}
          </td>
        </tr>`;

    case 'button':
      const btn = block.settings?.button;
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="border-radius: ${btn?.buttonBorderRadius || '4px'}; background-color: ${btn?.buttonColor || '#0066cc'};">
                  <a href="${escapeHtml(btn?.url || '#')}" target="_blank" style="display: inline-block; padding: ${btn?.buttonPadding || '12px 24px'}; font-family: ${globalStyles.fontFamily}; font-size: ${globalStyles.fontSize}; font-weight: bold; color: ${btn?.buttonTextColor || '#ffffff'}; text-decoration: none; border-radius: ${btn?.buttonBorderRadius || '4px'};">
                    ${escapeHtml(btn?.text || 'Click Here')}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;

    case 'divider':
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <hr style="border: none; border-top: ${block.settings?.dividerWidth || '1px'} ${block.settings?.dividerStyle || 'solid'} ${block.settings?.dividerColor || '#e0e0e0'}; margin: 0;" />
          </td>
        </tr>`;

    case 'spacer':
      return `
        <tr>
          <td style="height: ${block.settings?.spacerHeight || '32px'}; background-color: ${style.backgroundColor || 'transparent'};">
            &nbsp;
          </td>
        </tr>`;

    case 'social':
      const socialLinks = block.settings?.social || [];
      const socialHtml = socialLinks.map(link => {
        const icons: Record<string, string> = {
          facebook: '📘',
          twitter: '🐦',
          linkedin: '💼',
          instagram: '📷',
          youtube: '📺',
          tiktok: '🎵',
          pinterest: '📌',
          website: '🌐',
        };
        return `<a href="${escapeHtml(link.url)}" target="_blank" style="display: inline-block; margin: 0 8px; text-decoration: none; font-size: 24px;">${icons[link.platform] || '🔗'}</a>`;
      }).join('');
      return `
        <tr>
          <td style="${baseStyle}; text-align: center;" class="mobile-padding">
            ${socialHtml}
          </td>
        </tr>`;

    case 'quote':
      return `
        <tr>
          <td style="${baseStyle}; border-left: 4px solid ${globalStyles.linkColor}; padding-left: 20px; font-style: italic;" class="mobile-padding">
            ${escapeHtml(block.content || '')}
          </td>
        </tr>`;

    case 'list':
      const listItems = block.settings?.list?.items || [];
      const listType = block.settings?.list?.listType === 'numbered' ? 'ol' : 'ul';
      const listHtml = listItems.map(item => `<li style="margin-bottom: 8px;">${escapeHtml(item)}</li>`).join('');
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <${listType} style="margin: 0; padding-left: 24px;">
              ${listHtml}
            </${listType}>
          </td>
        </tr>`;

    case 'columns':
      const columns = block.settings?.columns || [];
      const colHtml = columns.map(col => `
        <td style="width: ${col.width}; vertical-align: top; padding: 8px;" class="mobile-stack">
          <!-- Column content -->
        </td>
      `).join('');
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                ${colHtml}
              </tr>
            </table>
          </td>
        </tr>`;

    case 'video':
      const video = block.settings?.video;
      return `
        <tr>
          <td style="${baseStyle}; text-align: center;" class="mobile-padding">
            ${video?.thumbnail ? `
              <a href="${escapeHtml(video.url || '#')}" target="_blank" style="display: inline-block; position: relative;">
                <img src="${escapeHtml(video.thumbnail)}" alt="Video thumbnail" style="max-width: 100%; height: auto; display: block;" />
              </a>
            ` : ''}
          </td>
        </tr>`;

    case 'html':
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            ${block.content || ''}
          </td>
        </tr>`;

    case 'countdown':
      return `
        <tr>
          <td style="${baseStyle}; text-align: center;" class="mobile-padding">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold;">00</div>
                  <div style="font-size: 12px; color: #666;">Days</div>
                </td>
                <td style="padding: 0 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold;">00</div>
                  <div style="font-size: 12px; color: #666;">Hours</div>
                </td>
                <td style="padding: 0 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold;">00</div>
                  <div style="font-size: 12px; color: #666;">Mins</div>
                </td>
                <td style="padding: 0 12px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold;">00</div>
                  <div style="font-size: 12px; color: #666;">Secs</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;

    case 'menu':
      const menuItems = block.settings?.menu?.items || [];
      const isVertical = block.settings?.menu?.orientation === 'vertical';
      const menuHtml = menuItems.map((item, i) => 
        `<a href="${escapeHtml(item.url)}" style="color: ${globalStyles.linkColor}; text-decoration: none; ${isVertical ? 'display: block; margin-bottom: 8px;' : `margin: 0 12px;`}">${escapeHtml(item.label)}</a>`
      ).join(isVertical ? '' : ' | ');
      return `
        <tr>
          <td style="${baseStyle}; text-align: center;" class="mobile-padding">
            ${menuHtml}
          </td>
        </tr>`;

    case 'footer':
      return `
        <tr>
          <td style="${baseStyle}; text-align: center; font-size: 12px; color: #666666;" class="mobile-padding">
            <p style="margin: 0 0 8px 0;">${escapeHtml(block.content || '© 2024 Your Company. All rights reserved.')}</p>
            <p style="margin: 0;">
              <a href="{{unsubscribe_url}}" style="color: ${globalStyles.linkColor};">Unsubscribe</a>
              &nbsp;|&nbsp;
              <a href="#" style="color: ${globalStyles.linkColor};">View in browser</a>
            </p>
          </td>
        </tr>`;

    case 'table':
      const tableRows = block.settings?.table?.rows || [];
      const hasHeader = block.settings?.table?.headerRow;
      const tableHtml = tableRows.map((row, rowIndex) => {
        const cellsHtml = row.cells.map(cell => {
          const isHeader = hasHeader && rowIndex === 0;
          const cellTag = isHeader ? 'th' : 'td';
          const cellStyle = isHeader 
            ? 'padding: 12px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold; text-align: left;'
            : 'padding: 12px; border: 1px solid #ddd; text-align: left;';
          return `<${cellTag} style="${cellStyle}">${escapeHtml(cell.content || '')}</${cellTag}>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
              ${tableHtml}
            </table>
          </td>
        </tr>`;

    case 'hero':
      const hero = block.settings?.hero;
      return `
        <tr>
          <td style="text-align: center; background-color: ${hero?.backgroundColor || '#4F46E5'}; padding: 48px 24px;" class="mobile-padding">
            <h1 style="font-size: 36px; font-weight: bold; color: #ffffff; margin: 0 0 16px 0;">${escapeHtml(hero?.title || 'Hero Title')}</h1>
            ${hero?.subtitle ? `<p style="font-size: 18px; color: rgba(255,255,255,0.8); margin: 0 0 24px 0;">${escapeHtml(hero.subtitle)}</p>` : ''}
            ${hero?.buttonText ? `<a href="${escapeHtml(hero?.buttonUrl || '#')}" style="display: inline-block; background-color: #ffffff; color: ${hero?.backgroundColor || '#4F46E5'}; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">${escapeHtml(hero.buttonText)}</a>` : ''}
          </td>
        </tr>`;

    case 'testimonial':
      const testimonial = block.settings?.testimonial;
      return `
        <tr>
          <td style="${baseStyle}; text-align: center; padding: 32px 24px;" class="mobile-padding">
            ${testimonial?.rating ? `<div style="font-size: 24px; margin-bottom: 16px;">${'⭐'.repeat(testimonial.rating)}</div>` : ''}
            <p style="font-size: 18px; font-style: italic; margin: 0 0 16px 0;">"${escapeHtml(testimonial?.quote || 'Customer testimonial')}"</p>
            <p style="font-weight: bold; margin: 0;">${escapeHtml(testimonial?.author || 'Customer Name')}</p>
            ${(testimonial?.role || testimonial?.company) ? `<p style="font-size: 14px; color: #6B7280; margin: 4px 0 0 0;">${escapeHtml(testimonial?.role || '')}${testimonial?.role && testimonial?.company ? ' at ' : ''}${escapeHtml(testimonial?.company || '')}</p>` : ''}
          </td>
        </tr>`;

    case 'pricing':
      const pricing = block.settings?.pricing;
      const pricingFeatures = (pricing?.features || []).map(f => `<li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">✓ ${escapeHtml(f)}</li>`).join('');
      return `
        <tr>
          <td style="${baseStyle}; text-align: center; padding: 32px 24px;" class="mobile-padding">
            <div style="border: ${pricing?.highlighted ? `2px solid ${globalStyles.linkColor}` : '1px solid #E5E7EB'}; border-radius: 12px; padding: 24px;">
              <p style="font-weight: bold; font-size: 18px; margin: 0 0 8px 0;">${escapeHtml(pricing?.planName || 'Plan')}</p>
              <p style="font-size: 48px; font-weight: bold; color: ${globalStyles.linkColor}; margin: 0;">${escapeHtml(pricing?.price || '$29')}<span style="font-size: 16px; color: #6B7280;">${escapeHtml(pricing?.period || '/month')}</span></p>
              <ul style="list-style: none; padding: 24px 0; margin: 0; text-align: left;">${pricingFeatures}</ul>
              <a href="${escapeHtml(pricing?.buttonUrl || '#')}" style="display: inline-block; background-color: ${globalStyles.linkColor}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">${escapeHtml(pricing?.buttonText || 'Get Started')}</a>
            </div>
          </td>
        </tr>`;

    case 'cta':
      const cta = block.settings?.cta;
      return `
        <tr>
          <td style="text-align: center; background-color: ${globalStyles.linkColor}; padding: 48px 24px; border-radius: 12px;" class="mobile-padding">
            <h2 style="font-size: 28px; font-weight: bold; color: #ffffff; margin: 0 0 12px 0;">${escapeHtml(cta?.headline || 'Ready to Get Started?')}</h2>
            ${cta?.subheadline ? `<p style="font-size: 16px; color: rgba(255,255,255,0.8); margin: 0 0 24px 0;">${escapeHtml(cta.subheadline)}</p>` : ''}
            <a href="${escapeHtml(cta?.buttonUrl || '#')}" style="display: inline-block; background-color: #ffffff; color: ${globalStyles.linkColor}; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">${escapeHtml(cta?.buttonText || 'Get Started')}</a>
          </td>
        </tr>`;

    case 'stats':
      const statsData = block.settings?.stats?.stats || [];
      const statsHtml = statsData.map(stat => `
        <td style="text-align: center; padding: 16px;">
          <div style="font-size: 36px; font-weight: bold; color: ${globalStyles.linkColor};">${escapeHtml(stat.prefix || '')}${escapeHtml(stat.value)}${escapeHtml(stat.suffix || '')}</div>
          <div style="font-size: 14px; color: #6B7280;">${escapeHtml(stat.label)}</div>
        </td>
      `).join('');
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>${statsHtml}</tr>
            </table>
          </td>
        </tr>`;

    case 'signature':
      const sig = block.settings?.signature;
      return `
        <tr>
          <td style="${baseStyle}; padding: 24px;" class="mobile-padding">
            <p style="font-weight: bold; font-size: 16px; margin: 0;">${escapeHtml(sig?.name || 'Your Name')}</p>
            ${sig?.title ? `<p style="color: #6B7280; margin: 4px 0 0 0;">${escapeHtml(sig.title)}</p>` : ''}
            ${sig?.company ? `<p style="color: #6B7280; margin: 4px 0 0 0;">${escapeHtml(sig.company)}</p>` : ''}
            <div style="margin-top: 12px; font-size: 14px;">
              ${sig?.email ? `<p style="margin: 4px 0;">📧 ${escapeHtml(sig.email)}</p>` : ''}
              ${sig?.phone ? `<p style="margin: 4px 0;">📞 ${escapeHtml(sig.phone)}</p>` : ''}
              ${sig?.website ? `<p style="margin: 4px 0;">🌐 ${escapeHtml(sig.website)}</p>` : ''}
            </div>
          </td>
        </tr>`;

    case 'url':
      const urlSettings = block.settings?.url;
      const urlStyle = urlSettings?.style || 'link';
      if (urlStyle === 'card') {
        return `
          <tr>
            <td style="${baseStyle}" class="mobile-padding">
              <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px;">
                <a href="${escapeHtml(urlSettings?.url || '#')}" style="color: ${globalStyles.linkColor}; font-weight: bold; text-decoration: none;">${escapeHtml(urlSettings?.displayText || 'Link')}</a>
                ${urlSettings?.description ? `<p style="font-size: 14px; color: #6B7280; margin: 8px 0 0 0;">${escapeHtml(urlSettings.description)}</p>` : ''}
              </div>
            </td>
          </tr>`;
      } else if (urlStyle === 'button') {
        return `
          <tr>
            <td style="${baseStyle}; text-align: center;" class="mobile-padding">
              <a href="${escapeHtml(urlSettings?.url || '#')}" style="display: inline-block; background-color: ${globalStyles.linkColor}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${escapeHtml(urlSettings?.displayText || 'Click Here')}</a>
            </td>
          </tr>`;
      }
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <a href="${escapeHtml(urlSettings?.url || '#')}" style="color: ${globalStyles.linkColor};">${escapeHtml(urlSettings?.displayText || urlSettings?.url || 'Link')}</a>
          </td>
        </tr>`;

    case 'calendar':
      const calSettings = block.settings?.calendar;
      const eventDate = calSettings?.eventDate ? new Date(calSettings.eventDate) : new Date();
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <div style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
              <div style="background-color: ${globalStyles.linkColor}; color: #ffffff; padding: 16px; text-align: center;">
                <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                <div style="font-size: 36px; font-weight: bold;">${eventDate.getDate()}</div>
              </div>
              <div style="padding: 16px;">
                <p style="font-weight: bold; font-size: 18px; margin: 0 0 8px 0;">${escapeHtml(calSettings?.eventTitle || 'Event')}</p>
                ${calSettings?.eventTime ? `<p style="color: #6B7280; margin: 0 0 4px 0;">🕐 ${escapeHtml(calSettings.eventTime)}</p>` : ''}
                ${calSettings?.eventLocation ? `<p style="color: #6B7280; margin: 0 0 8px 0;">📍 ${escapeHtml(calSettings.eventLocation)}</p>` : ''}
                ${calSettings?.eventDescription ? `<p style="font-size: 14px; color: #6B7280; margin: 0 0 12px 0;">${escapeHtml(calSettings.eventDescription)}</p>` : ''}
                <a href="${escapeHtml(calSettings?.addToCalendarUrl || '#')}" style="display: inline-block; background-color: ${globalStyles.linkColor}; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">📅 Add to Calendar</a>
              </div>
            </div>
          </td>
        </tr>`;

    case 'map':
      const mapSettings = block.settings?.map;
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <div style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
              ${mapSettings?.mapImageUrl ? `<img src="${escapeHtml(mapSettings.mapImageUrl)}" alt="Map" style="width: 100%; height: 200px; object-fit: cover;" />` : `<div style="width: 100%; height: 200px; background-color: #F3F4F6; display: flex; align-items: center; justify-content: center; color: #9CA3AF;">📍 Map</div>`}
              <div style="padding: 16px;">
                <p style="font-weight: bold; margin: 0 0 8px 0;">📍 ${escapeHtml(mapSettings?.address || 'Address')}</p>
                <a href="${escapeHtml(mapSettings?.directionsUrl || '#')}" style="color: ${globalStyles.linkColor}; font-size: 14px;">Get Directions →</a>
              </div>
            </div>
          </td>
        </tr>`;

    case 'coupon':
      const couponSettings = block.settings?.coupon;
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <div style="border: 2px ${couponSettings?.borderStyle || 'dashed'} ${couponSettings?.backgroundColor || globalStyles.linkColor}; border-radius: 12px; padding: 24px; text-align: center; background-color: ${(couponSettings?.backgroundColor || globalStyles.linkColor)}10;">
              <p style="font-size: 14px; color: #6B7280; margin: 0 0 8px 0;">🎟️ COUPON CODE</p>
              <p style="font-size: 32px; font-weight: bold; color: ${couponSettings?.backgroundColor || globalStyles.linkColor}; letter-spacing: 4px; margin: 0 0 8px 0;">${escapeHtml(couponSettings?.code || 'SAVE20')}</p>
              <p style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">${escapeHtml(couponSettings?.discount || '20% OFF')}</p>
              ${couponSettings?.description ? `<p style="color: #6B7280; margin: 0 0 8px 0;">${escapeHtml(couponSettings.description)}</p>` : ''}
              ${couponSettings?.expiryDate ? `<p style="font-size: 12px; color: #9CA3AF; margin: 0;">Expires: ${escapeHtml(couponSettings.expiryDate)}</p>` : ''}
              ${couponSettings?.terms ? `<p style="font-size: 11px; color: #9CA3AF; margin: 8px 0 0 0;">${escapeHtml(couponSettings.terms)}</p>` : ''}
            </div>
          </td>
        </tr>`;

    case 'rating':
      const ratingSettings = block.settings?.rating;
      const ratingValue = ratingSettings?.rating || 5;
      const maxRating = ratingSettings?.maxRating || 5;
      const ratingStyleType = ratingSettings?.style || 'stars';
      const ratingIcon = ratingStyleType === 'hearts' ? '❤️' : ratingStyleType === 'circles' ? '●' : '⭐';
      const emptyIcon = ratingStyleType === 'hearts' ? '🤍' : ratingStyleType === 'circles' ? '○' : '☆';
      let ratingHtml = '';
      for (let i = 0; i < maxRating; i++) {
        ratingHtml += i < ratingValue ? ratingIcon : emptyIcon;
      }
      return `
        <tr>
          <td style="${baseStyle}; text-align: center;" class="mobile-padding">
            <div style="font-size: 24px; letter-spacing: 4px;">${ratingHtml}</div>
            ${ratingSettings?.showNumber ? `<p style="font-size: 14px; color: #6B7280; margin: 8px 0 0 0;">${ratingValue} / ${maxRating}</p>` : ''}
          </td>
        </tr>`;

    case 'progress':
      const progressSettings = block.settings?.progress;
      const progressValue = progressSettings?.value || 75;
      const progressMax = progressSettings?.max || 100;
      const progressPercent = Math.round((progressValue / progressMax) * 100);
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            ${progressSettings?.label ? `<p style="margin: 0 0 8px 0; font-weight: bold;">${escapeHtml(progressSettings.label)}</p>` : ''}
            <div style="background-color: #E5E7EB; border-radius: 999px; height: 24px; overflow: hidden;">
              <div style="background-color: ${progressSettings?.color || globalStyles.linkColor}; height: 100%; width: ${progressPercent}%; border-radius: 999px; text-align: center; line-height: 24px; color: #ffffff; font-size: 12px; font-weight: bold;">
                ${progressSettings?.showPercentage !== false ? `${progressPercent}%` : ''}
              </div>
            </div>
          </td>
        </tr>`;

    case 'accordion':
      const accordionSettings = block.settings?.accordion;
      const accordionItems = accordionSettings?.items || [];
      const accordionHtml = accordionItems.map(item => `
        <div style="border-bottom: 1px solid #E5E7EB; margin-bottom: 8px;">
          <p style="font-weight: bold; padding: 12px 0; margin: 0;">${escapeHtml(item.title)} ▼</p>
          <p style="padding: 0 0 12px 0; margin: 0; color: #6B7280;">${escapeHtml(item.content)}</p>
        </div>
      `).join('');
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            ${accordionHtml || '<p style="text-align: center; color: #9CA3AF;">No accordion items</p>'}
          </td>
        </tr>`;

    case 'iconList':
      const iconListSettings = block.settings?.iconList;
      const iconListItems = iconListSettings?.items || [];
      const iconListHtml = iconListItems.map(item => `
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
          <span style="font-size: 24px; color: ${iconListSettings?.iconColor || globalStyles.linkColor};">${escapeHtml(item.icon)}</span>
          <div>
            <p style="font-weight: bold; margin: 0;">${escapeHtml(item.text)}</p>
            ${item.subtext ? `<p style="font-size: 14px; color: #6B7280; margin: 4px 0 0 0;">${escapeHtml(item.subtext)}</p>` : ''}
          </div>
        </div>
      `).join('');
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            ${iconListHtml || '<p style="text-align: center; color: #9CA3AF;">No items</p>'}
          </td>
        </tr>`;

    case 'beforeAfter':
      const baSettings = block.settings?.beforeAfter;
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width: 50%; text-align: center; padding: 8px;">
                  <p style="font-size: 12px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin: 0 0 8px 0;">${escapeHtml(baSettings?.beforeLabel || 'Before')}</p>
                  ${baSettings?.beforeImage ? `<img src="${escapeHtml(baSettings.beforeImage)}" alt="Before" style="width: 100%; border-radius: 8px;" />` : `<div style="background-color: #F3F4F6; padding: 40px; border-radius: 8px; color: #9CA3AF;">Before</div>`}
                </td>
                <td style="width: 50%; text-align: center; padding: 8px;">
                  <p style="font-size: 12px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin: 0 0 8px 0;">${escapeHtml(baSettings?.afterLabel || 'After')}</p>
                  ${baSettings?.afterImage ? `<img src="${escapeHtml(baSettings.afterImage)}" alt="After" style="width: 100%; border-radius: 8px;" />` : `<div style="background-color: #F3F4F6; padding: 40px; border-radius: 8px; color: #9CA3AF;">After</div>`}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;

    default:
      return `
        <tr>
          <td style="${baseStyle}" class="mobile-padding">
            ${escapeHtml(block.content || '')}
          </td>
        </tr>`;
  }
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

export default generateEmailHtml;
