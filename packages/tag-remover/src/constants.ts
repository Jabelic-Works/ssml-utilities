/**
 * XMLコメント <!-- -->
 */
export const XML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

/**
 * CDATAセクション <![CDATA[ ]]
 */
export const CDATA_SECTION_PATTERN = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
export const PROCESSING_INSTRUCTION_PATTERN = /<\?[\s\S]*?\?>/g;
