import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('tokens.css',import.meta.url),'utf8');
const value=name=>new RegExp('--'+name+':\\s*([^;]+)').exec(css)?.[1].trim();
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
describe('Unified dark readability requirements',()=>{
  it.each([
    ['text-primary','surface-root'],['text-primary','surface-panel'],['text-secondary','surface-panel'],['text-muted','surface-raised'],['text-disabled','surface-hover'],
    ['state-pass-text','state-pass-bg'],['state-warning-text','state-warning-bg'],['state-fail-text','state-fail-bg'],['accent-violet','surface-panel'],
  ])('keeps normal-size %s readable against %s at WCAG AA contrast', (text,surface)=>{expect(contrast(value(text),value(surface))).toBeGreaterThanOrEqual(4.5);});
  it('uses a readable type scale without page scaling and retains keyboard/reduced-motion support',()=>{
    expect(parseFloat(value('font-body'))).toBeGreaterThanOrEqual(16);expect(parseFloat(value('font-secondary'))).toBeGreaterThanOrEqual(14);expect(parseFloat(value('font-label'))).toBeGreaterThanOrEqual(14);
    const styles=fs.readFileSync(new URL('styles.css',import.meta.url),'utf8');expect(styles).toContain(':focus-visible');expect(styles).toContain('prefers-reduced-motion:reduce');expect(styles).not.toMatch(/font-size:\s*(?:[0-9]|1[0-3])px/);expect(styles).not.toMatch(/zoom:\s*[0-9]/);
  });
});
