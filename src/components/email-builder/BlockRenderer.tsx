import React, { useState } from 'react';
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown,
  Settings,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailBlock, GlobalStyles, BlockType, DEFAULT_BLOCK_STYLE } from './types';
import { cn } from '@/lib/utils';

interface BlockRendererProps {
  block: EmailBlock;
  globalStyles: GlobalStyles;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onUpdate?: (block: EmailBlock) => void;
  onAddBlockToColumn?: (columnIndex: number, blockType: BlockType) => void;
  onSelectNestedBlock?: (blockId: string) => void;
  selectedNestedBlockId?: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  globalStyles,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onEdit,
  onUpdate,
  onAddBlockToColumn,
  onSelectNestedBlock,
  selectedNestedBlockId,
  canMoveUp,
  canMoveDown,
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);

  const getBlockStyle = (): React.CSSProperties => {
    return {
      backgroundColor: block.style.backgroundColor || 'transparent',
      color: block.style.textColor || globalStyles.textColor,
      fontSize: block.style.fontSize || globalStyles.fontSize,
      fontFamily: block.style.fontFamily || globalStyles.fontFamily,
      textAlign: block.style.textAlign || 'left',
      padding: block.style.padding || '16px',
      margin: block.style.margin || '0',
      borderRadius: block.style.borderRadius || '0',
      lineHeight: block.style.lineHeight || '1.5',
    };
  };

  const handleDrop = (e: React.DragEvent, columnIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);

    const mergeTag = e.dataTransfer.getData('mergeTag');
    const textData = e.dataTransfer.getData('text/plain');
    const blockType = e.dataTransfer.getData('blockType') as BlockType;

    // Handle merge tag drop
    if (mergeTag && onUpdate) {
      const updatedBlock = {
        ...block,
        content: block.content + mergeTag
      };
      onUpdate(updatedBlock);
      return;
    }

    // Handle block type drop into column
    if (blockType && columnIndex !== undefined && onAddBlockToColumn) {
      onAddBlockToColumn(columnIndex, blockType);
      return;
    }

    // Handle text drop
    if (textData && onUpdate) {
      const updatedBlock = {
        ...block,
        content: block.content + textData
      };
      onUpdate(updatedBlock);
    }
  };

  const handleDragOver = (e: React.DragEvent, columnIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (columnIndex !== undefined) {
      setDragOverColumn(columnIndex);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <div 
            style={getBlockStyle()}
            dangerouslySetInnerHTML={{ __html: block.content || '<p>Click to edit text...</p>' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        );

      case 'heading':
        return (
          <h2 
            style={{
              ...getBlockStyle(),
              fontWeight: block.style.fontWeight || 'bold',
              color: block.style.textColor || globalStyles.headingColor,
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {block.content || 'Click to edit heading...'}
          </h2>
        );

      case 'image':
        return (
          <div style={{ ...getBlockStyle(), textAlign: block.settings?.image?.alignment || 'center' }}>
            {block.settings?.image?.src ? (
              <img 
                src={block.settings.image.src} 
                alt={block.settings.image.alt || ''} 
                style={{ 
                  maxWidth: block.settings.image.width || '100%',
                  height: block.settings.image.height || 'auto',
                }}
              />
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center text-muted-foreground">
                Click to add an image
              </div>
            )}
          </div>
        );

      case 'button':
        return (
          <div style={{ ...getBlockStyle(), textAlign: block.style.textAlign || 'center' }}>
            <a
              href={block.settings?.button?.url || '#'}
              style={{
                display: 'inline-block',
                backgroundColor: block.settings?.button?.buttonColor || '#0066cc',
                color: block.settings?.button?.buttonTextColor || '#ffffff',
                padding: block.settings?.button?.buttonPadding || '12px 24px',
                borderRadius: block.settings?.button?.buttonBorderRadius || '4px',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
              onClick={(e) => e.preventDefault()}
            >
              {block.settings?.button?.text || 'Click Here'}
            </a>
          </div>
        );

      case 'divider':
        return (
          <div style={getBlockStyle()}>
            <hr 
              style={{
                border: 'none',
                borderTop: `${block.settings?.dividerWidth || '1px'} ${block.settings?.dividerStyle || 'solid'} ${block.settings?.dividerColor || '#e0e0e0'}`,
                margin: '0',
              }}
            />
          </div>
        );

      case 'spacer':
        return (
          <div 
            style={{ 
              height: block.settings?.spacerHeight || '32px',
              backgroundColor: block.style.backgroundColor || 'transparent',
            }}
            className="flex items-center justify-center"
          >
            <span className="text-xs text-muted-foreground opacity-50">
              {block.settings?.spacerHeight || '32px'} spacer
            </span>
          </div>
        );

      case 'social':
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center' }}>
            <div className="flex justify-center gap-3 flex-wrap">
              {(block.settings?.social || []).map((link, index) => (
                <a 
                  key={index} 
                  href={link.url || '#'}
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-lg"
                >
                  {link.platform === 'facebook' && '📘'}
                  {link.platform === 'twitter' && '🐦'}
                  {link.platform === 'linkedin' && '💼'}
                  {link.platform === 'instagram' && '📷'}
                  {link.platform === 'youtube' && '📺'}
                  {link.platform === 'tiktok' && '🎵'}
                  {link.platform === 'pinterest' && '📌'}
                  {link.platform === 'website' && '🌐'}
                </a>
              ))}
              {(!block.settings?.social || block.settings.social.length === 0) && (
                <span className="text-muted-foreground text-sm">Click to add social links</span>
              )}
            </div>
          </div>
        );

      case 'quote':
        return (
          <blockquote 
            style={{
              ...getBlockStyle(),
              borderLeft: '4px solid ' + (globalStyles.linkColor || '#0066cc'),
              paddingLeft: '20px',
              fontStyle: 'italic',
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {block.content || 'Click to add a quote...'}
          </blockquote>
        );

      case 'list':
        const ListTag = block.settings?.list?.listType === 'numbered' ? 'ol' : 'ul';
        return (
          <ListTag style={{ ...getBlockStyle(), paddingLeft: '24px' }}>
            {(block.settings?.list?.items || ['Item 1', 'Item 2', 'Item 3']).map((item, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
            ))}
          </ListTag>
        );

      case 'columns':
        const columns = block.settings?.columns || [{ width: '50%', content: [] }, { width: '50%', content: [] }];
        return (
          <div style={getBlockStyle()}>
            <div className="flex gap-4">
              {columns.map((col, colIndex) => (
                <div 
                  key={colIndex} 
                  style={{ width: col.width }}
                  className={cn(
                    "border-2 border-dashed rounded p-3 min-h-[100px] transition-colors",
                    dragOverColumn === colIndex 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                  )}
                  onDrop={(e) => handleDrop(e, colIndex)}
                  onDragOver={(e) => handleDragOver(e, colIndex)}
                  onDragLeave={handleDragLeave}
                >
                  <div className="text-xs text-muted-foreground mb-2 font-medium">Column {colIndex + 1}</div>
                  {col.content && col.content.length > 0 ? (
                    <div className="space-y-2">
                      {col.content.map((nestedBlock: EmailBlock, blockIndex: number) => (
                        <div 
                          key={nestedBlock.id || blockIndex} 
                          className={cn(
                            "p-2 rounded text-sm cursor-pointer transition-all border-2",
                            selectedNestedBlockId === nestedBlock.id 
                              ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-1" 
                              : "border-transparent bg-muted/50 hover:border-primary/50 hover:bg-muted"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectNestedBlock) {
                              onSelectNestedBlock(nestedBlock.id);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize text-xs">{nestedBlock.type}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete nested block
                                  if (onUpdate) {
                                    const updatedColumns = [...columns];
                                    updatedColumns[colIndex] = {
                                      ...updatedColumns[colIndex],
                                      content: updatedColumns[colIndex].content.filter((_: EmailBlock, i: number) => i !== blockIndex)
                                    };
                                    onUpdate({
                                      ...block,
                                      settings: { ...block.settings, columns: updatedColumns }
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-muted-foreground truncate mt-1">
                            {nestedBlock.content?.substring(0, 40) || nestedBlock.settings?.button?.text || nestedBlock.settings?.image?.alt || 'Click to edit'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-16 text-muted-foreground">
                      <Plus className="h-5 w-5 mb-1 opacity-50" />
                      <span className="text-xs">Drop blocks here</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'video':
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center' }}>
            {block.settings?.video?.thumbnail ? (
              <div className="relative inline-block">
                <img 
                  src={block.settings.video.thumbnail} 
                  alt="Video thumbnail" 
                  className="max-w-full rounded"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-black/70 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[18px] border-l-white border-y-[10px] border-y-transparent ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center text-muted-foreground">
                Click to add video
              </div>
            )}
          </div>
        );

      case 'html':
        return (
          <div style={getBlockStyle()}>
            {block.content ? (
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground font-mono text-sm">
                &lt;/&gt; Custom HTML
              </div>
            )}
          </div>
        );

      case 'countdown':
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center' }}>
            <div className="flex justify-center gap-3">
              {['Days', 'Hours', 'Mins', 'Secs'].map((unit) => (
                <div key={unit} className="text-center bg-muted rounded-lg p-3 min-w-[60px]">
                  <div className="text-2xl font-bold">00</div>
                  <div className="text-xs text-muted-foreground">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'menu':
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center' }}>
            <nav className={cn(
              "flex gap-4",
              block.settings?.menu?.orientation === 'vertical' ? 'flex-col items-center' : 'justify-center flex-wrap'
            )}>
              {(block.settings?.menu?.items || [
                { label: 'Home', url: '#' },
                { label: 'About', url: '#' },
                { label: 'Contact', url: '#' },
              ]).map((item, index) => (
                <a 
                  key={index} 
                  href={item.url}
                  onClick={(e) => e.preventDefault()}
                  style={{ color: globalStyles.linkColor }}
                  className="hover:underline"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        );

      case 'footer':
        return (
          <div 
            style={{ ...getBlockStyle(), textAlign: 'center', fontSize: '12px', color: '#666' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <p>{block.content || '© 2024 Your Company. All rights reserved.'}</p>
            <p className="mt-2">
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: globalStyles.linkColor }}>Unsubscribe</a>
              {' | '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: globalStyles.linkColor }}>View in browser</a>
            </p>
          </div>
        );

      case 'table':
        const rows = block.settings?.table?.rows || [
          { cells: [{ content: 'Header 1' }, { content: 'Header 2' }, { content: 'Header 3' }] },
          { cells: [{ content: 'Cell 1' }, { content: 'Cell 2' }, { content: 'Cell 3' }] },
        ];
        return (
          <div style={getBlockStyle()}>
            <table className="w-full border-collapse">
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.cells.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex}
                        className={cn(
                          "border border-muted-foreground/30 p-2",
                          rowIndex === 0 && block.settings?.table?.headerRow && "font-bold bg-muted"
                        )}
                      >
                        {cell.content}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'hero':
        const hero = block.settings?.hero;
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center', backgroundColor: hero?.backgroundColor || '#4F46E5', padding: '48px 24px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 16px 0' }}>
              {hero?.title || 'Hero Title'}
            </h1>
            {hero?.subtitle && (
              <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', margin: '0 0 24px 0' }}>
                {hero.subtitle}
              </p>
            )}
            {hero?.buttonText && (
              <a href={hero?.buttonUrl || '#'} onClick={(e) => e.preventDefault()} style={{ display: 'inline-block', backgroundColor: '#ffffff', color: hero?.backgroundColor || '#4F46E5', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                {hero.buttonText}
              </a>
            )}
          </div>
        );

      case 'testimonial':
        const testimonial = block.settings?.testimonial;
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center', padding: '32px 24px' }}>
            {testimonial?.rating && (
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>
                {'⭐'.repeat(testimonial.rating)}
              </div>
            )}
            <blockquote style={{ fontSize: '18px', fontStyle: 'italic', margin: '0 0 16px 0', color: globalStyles.textColor }}>
              "{testimonial?.quote || 'Customer testimonial goes here'}"
            </blockquote>
            <div style={{ fontWeight: 'bold' }}>{testimonial?.author || 'Customer Name'}</div>
            {(testimonial?.role || testimonial?.company) && (
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {testimonial?.role}{testimonial?.role && testimonial?.company && ' at '}{testimonial?.company}
              </div>
            )}
          </div>
        );

      case 'pricing':
        const pricing = block.settings?.pricing;
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center', padding: '32px 24px', border: pricing?.highlighted ? `2px solid ${globalStyles.linkColor}` : '1px solid #E5E7EB', borderRadius: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>{pricing?.planName || 'Plan Name'}</div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: globalStyles.linkColor }}>
              {pricing?.price || '$29'}
              <span style={{ fontSize: '16px', color: '#6B7280' }}>{pricing?.period || '/month'}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: '24px 0', margin: 0, textAlign: 'left' }}>
              {(pricing?.features || ['Feature 1', 'Feature 2', 'Feature 3']).map((feature, i) => (
                <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>✓ {feature}</li>
              ))}
            </ul>
            <a href={pricing?.buttonUrl || '#'} onClick={(e) => e.preventDefault()} style={{ display: 'inline-block', backgroundColor: globalStyles.linkColor, color: '#ffffff', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
              {pricing?.buttonText || 'Get Started'}
            </a>
          </div>
        );

      case 'feature':
        const feature = block.settings?.feature;
        return (
          <div style={{ ...getBlockStyle(), padding: '24px' }}>
            {feature?.icon && <div style={{ fontSize: '32px', marginBottom: '12px' }}>{feature.icon}</div>}
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{feature?.title || 'Feature Title'}</h3>
            <p style={{ margin: 0, color: '#6B7280' }}>{feature?.description || 'Feature description goes here.'}</p>
          </div>
        );

      case 'cta':
        const cta = block.settings?.cta;
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center', backgroundColor: globalStyles.linkColor, padding: '48px 24px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 12px 0' }}>
              {cta?.headline || 'Ready to Get Started?'}
            </h2>
            {cta?.subheadline && (
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '0 0 24px 0' }}>
                {cta.subheadline}
              </p>
            )}
            <a href={cta?.buttonUrl || '#'} onClick={(e) => e.preventDefault()} style={{ display: 'inline-block', backgroundColor: '#ffffff', color: globalStyles.linkColor, padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
              {cta?.buttonText || 'Get Started'}
            </a>
          </div>
        );

      case 'imageText':
        const imageText = block.settings?.imageText;
        const isImageLeft = imageText?.imagePosition !== 'right';
        return (
          <div style={{ ...getBlockStyle(), display: 'flex', gap: '24px', alignItems: 'center', flexDirection: isImageLeft ? 'row' : 'row-reverse' }}>
            <div style={{ flex: '0 0 40%' }}>
              {imageText?.imageUrl ? (
                <img src={imageText.imageUrl} alt={imageText?.imageAlt || ''} style={{ width: '100%', borderRadius: '8px' }} />
              ) : (
                <div style={{ backgroundColor: '#F3F4F6', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#9CA3AF' }}>Image</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 12px 0' }}>{imageText?.title || 'Title'}</h3>
              <p style={{ margin: '0 0 16px 0', color: '#6B7280' }}>{imageText?.description || 'Description'}</p>
              {imageText?.buttonText && (
                <a href={imageText?.buttonUrl || '#'} onClick={(e) => e.preventDefault()} style={{ color: globalStyles.linkColor, fontWeight: 'bold' }}>
                  {imageText.buttonText} →
                </a>
              )}
            </div>
          </div>
        );

      case 'gallery':
        const gallery = block.settings?.gallery;
        const galleryImages = gallery?.images || [];
        const galleryCols = gallery?.columns || 3;
        return (
          <div style={{ ...getBlockStyle(), display: 'grid', gridTemplateColumns: `repeat(${galleryCols}, 1fr)`, gap: '12px' }}>
            {galleryImages.map((img, i) => (
              <img key={i} src={img.src} alt={img.alt || ''} style={{ width: '100%', borderRadius: '8px' }} />
            ))}
            {galleryImages.length === 0 && (
              <div style={{ gridColumn: `span ${galleryCols}`, textAlign: 'center', padding: '40px', backgroundColor: '#F3F4F6', borderRadius: '8px', color: '#9CA3AF' }}>
                Add images to gallery
              </div>
            )}
          </div>
        );

      case 'stats':
        const statsData = block.settings?.stats?.stats || [];
        return (
          <div style={{ ...getBlockStyle(), display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '32px 24px' }}>
            {statsData.map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: globalStyles.linkColor }}>
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>{stat.label}</div>
              </div>
            ))}
            {statsData.length === 0 && (
              <div style={{ color: '#9CA3AF' }}>Add statistics</div>
            )}
          </div>
        );

      case 'faq':
        const faqItems = block.settings?.faq?.items || [];
        return (
          <div style={getBlockStyle()}>
            {faqItems.map((item, i) => (
              <div key={i} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Q: {item.question}</div>
                <div style={{ color: '#6B7280' }}>A: {item.answer}</div>
              </div>
            ))}
            {faqItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>Add FAQ items</div>
            )}
          </div>
        );

      case 'signature':
        const sig = block.settings?.signature;
        return (
          <div style={{ ...getBlockStyle(), padding: '24px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{sig?.name || 'Your Name'}</div>
            {sig?.title && <div style={{ color: '#6B7280' }}>{sig.title}</div>}
            {sig?.company && <div style={{ color: '#6B7280' }}>{sig.company}</div>}
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              {sig?.email && <div>📧 {sig.email}</div>}
              {sig?.phone && <div>📞 {sig.phone}</div>}
              {sig?.website && <div>🌐 {sig.website}</div>}
            </div>
          </div>
        );

      case 'url':
        const urlSettings = block.settings?.url;
        const urlStyle = urlSettings?.style || 'link';
        if (urlStyle === 'card') {
          return (
            <div style={{ ...getBlockStyle(), padding: '16px' }}>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {urlSettings?.favicon && <img src={urlSettings.favicon} alt="" style={{ width: '32px', height: '32px' }} />}
                <div>
                  <a href={urlSettings?.url || '#'} onClick={(e) => e.preventDefault()} style={{ color: globalStyles.linkColor, fontWeight: 'bold', textDecoration: 'none' }}>
                    {urlSettings?.displayText || 'Link Text'}
                  </a>
                  {urlSettings?.description && <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>{urlSettings.description}</div>}
                </div>
              </div>
            </div>
          );
        } else if (urlStyle === 'button') {
          return (
            <div style={{ ...getBlockStyle(), textAlign: 'center' }}>
              <a href={urlSettings?.url || '#'} onClick={(e) => e.preventDefault()} style={{ display: 'inline-block', backgroundColor: globalStyles.linkColor, color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
                {urlSettings?.displayText || 'Click Here'}
              </a>
            </div>
          );
        }
        return (
          <div style={getBlockStyle()}>
            <a href={urlSettings?.url || '#'} onClick={(e) => e.preventDefault()} style={{ color: globalStyles.linkColor }}>
              {urlSettings?.displayText || urlSettings?.url || 'Click to add URL'}
            </a>
          </div>
        );

      case 'calendar':
        const calSettings = block.settings?.calendar;
        return (
          <div style={{ ...getBlockStyle(), padding: '24px' }}>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: globalStyles.linkColor, color: '#ffffff', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {calSettings?.eventDate ? new Date(calSettings.eventDate).toLocaleDateString('en-US', { month: 'short' }) : 'Month'}
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                  {calSettings?.eventDate ? new Date(calSettings.eventDate).getDate() : '00'}
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>{calSettings?.eventTitle || 'Event Title'}</div>
                {calSettings?.eventTime && <div style={{ color: '#6B7280', marginBottom: '4px' }}>🕐 {calSettings.eventTime}</div>}
                {calSettings?.eventLocation && <div style={{ color: '#6B7280', marginBottom: '8px' }}>📍 {calSettings.eventLocation}</div>}
                {calSettings?.eventDescription && <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>{calSettings.eventDescription}</div>}
                <a href={calSettings?.addToCalendarUrl || '#'} onClick={(e) => e.preventDefault()} style={{ display: 'inline-block', backgroundColor: globalStyles.linkColor, color: '#ffffff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}>
                  📅 Add to Calendar
                </a>
              </div>
            </div>
          </div>
        );

      case 'map':
        const mapSettings = block.settings?.map;
        return (
          <div style={{ ...getBlockStyle(), padding: '16px' }}>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              {mapSettings?.mapImageUrl ? (
                <img src={mapSettings.mapImageUrl} alt="Map" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '200px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                  📍 Map Preview
                </div>
              )}
              <div style={{ padding: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📍 {mapSettings?.address || 'Address'}</div>
                <a href={mapSettings?.directionsUrl || '#'} onClick={(e) => e.preventDefault()} style={{ color: globalStyles.linkColor, fontSize: '14px' }}>
                  Get Directions →
                </a>
              </div>
            </div>
          </div>
        );

      case 'coupon':
        const couponSettings = block.settings?.coupon;
        return (
          <div style={{ ...getBlockStyle(), padding: '24px' }}>
            <div style={{ 
              border: `2px ${couponSettings?.borderStyle || 'dashed'} ${couponSettings?.backgroundColor || globalStyles.linkColor}`, 
              borderRadius: '12px', 
              padding: '24px', 
              textAlign: 'center',
              backgroundColor: (couponSettings?.backgroundColor || globalStyles.linkColor) + '10'
            }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>🎟️ COUPON CODE</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: couponSettings?.backgroundColor || globalStyles.linkColor, letterSpacing: '4px', marginBottom: '8px' }}>
                {couponSettings?.code || 'SAVE20'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{couponSettings?.discount || '20% OFF'}</div>
              {couponSettings?.description && <div style={{ color: '#6B7280', marginBottom: '8px' }}>{couponSettings.description}</div>}
              {couponSettings?.expiryDate && <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Expires: {couponSettings.expiryDate}</div>}
              {couponSettings?.terms && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>{couponSettings.terms}</div>}
            </div>
          </div>
        );

      case 'rating':
        const ratingSettings = block.settings?.rating;
        const ratingValue = ratingSettings?.rating || 5;
        const maxRating = ratingSettings?.maxRating || 5;
        const ratingStyle = ratingSettings?.style || 'stars';
        const ratingIcon = ratingStyle === 'hearts' ? '❤️' : ratingStyle === 'circles' ? '●' : '⭐';
        const emptyIcon = ratingStyle === 'hearts' ? '🤍' : ratingStyle === 'circles' ? '○' : '☆';
        return (
          <div style={{ ...getBlockStyle(), textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', letterSpacing: '4px' }}>
              {Array.from({ length: maxRating }, (_, i) => (
                <span key={i}>{i < ratingValue ? ratingIcon : emptyIcon}</span>
              ))}
            </div>
            {ratingSettings?.showNumber && <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>{ratingValue} / {maxRating}</div>}
          </div>
        );

      case 'progress':
        const progressSettings = block.settings?.progress;
        const progressValue = progressSettings?.value || 75;
        const progressMax = progressSettings?.max || 100;
        const progressPercent = Math.round((progressValue / progressMax) * 100);
        return (
          <div style={{ ...getBlockStyle(), padding: '16px' }}>
            {progressSettings?.label && <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{progressSettings.label}</div>}
            <div style={{ backgroundColor: '#E5E7EB', borderRadius: '999px', height: '24px', overflow: 'hidden' }}>
              <div style={{ 
                backgroundColor: progressSettings?.color || globalStyles.linkColor, 
                height: '100%', 
                width: `${progressPercent}%`,
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'width 0.3s ease'
              }}>
                {progressSettings?.showPercentage !== false && `${progressPercent}%`}
              </div>
            </div>
          </div>
        );

      case 'accordion':
        const accordionSettings = block.settings?.accordion;
        const accordionItems = accordionSettings?.items || [];
        return (
          <div style={getBlockStyle()}>
            {accordionItems.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {item.title}
                  <span style={{ color: '#9CA3AF' }}>▼</span>
                </div>
                <div style={{ padding: '0 0 12px 0', color: '#6B7280' }}>{item.content}</div>
              </div>
            ))}
            {accordionItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>Add accordion items</div>
            )}
          </div>
        );

      case 'iconList':
        const iconListSettings = block.settings?.iconList;
        const iconListItems = iconListSettings?.items || [];
        return (
          <div style={getBlockStyle()}>
            {iconListItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px', color: iconListSettings?.iconColor || globalStyles.linkColor }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.text}</div>
                  {item.subtext && <div style={{ fontSize: '14px', color: '#6B7280' }}>{item.subtext}</div>}
                </div>
              </div>
            ))}
            {iconListItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>Add icon list items</div>
            )}
          </div>
        );

      case 'beforeAfter':
        const baSettings = block.settings?.beforeAfter;
        return (
          <div style={{ ...getBlockStyle(), padding: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {baSettings?.beforeLabel || 'Before'}
                </div>
                {baSettings?.beforeImage ? (
                  <img src={baSettings.beforeImage} alt="Before" style={{ width: '100%', borderRadius: '8px' }} />
                ) : (
                  <div style={{ backgroundColor: '#F3F4F6', padding: '40px', borderRadius: '8px', color: '#9CA3AF' }}>Before Image</div>
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {baSettings?.afterLabel || 'After'}
                </div>
                {baSettings?.afterImage ? (
                  <img src={baSettings.afterImage} alt="After" style={{ width: '100%', borderRadius: '8px' }} />
                ) : (
                  <div style={{ backgroundColor: '#F3F4F6', padding: '40px', borderRadius: '8px', color: '#9CA3AF' }}>After Image</div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div style={getBlockStyle()}>{block.content || 'Unknown block type'}</div>;
    }
  };

  return (
    <div
      className={cn(
        "relative group cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onSelect}
    >
      {/* Block toolbar */}
      <div className={cn(
        "absolute -top-9 left-0 right-0 flex items-center justify-between bg-primary text-primary-foreground rounded-t-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10",
        isSelected && "opacity-100"
      )}>
        <div className="flex items-center gap-1">
          <GripVertical className="h-4 w-4 cursor-grab" />
          <span className="font-medium capitalize">{block.type}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20 hover:text-red-300"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Block content */}
      <div className="border border-transparent group-hover:border-primary/30 rounded transition-colors">
        {renderBlockContent()}
      </div>
    </div>
  );
};

export default BlockRenderer;
