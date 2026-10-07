const arabicIndic = '٠١٢٣٤٥٦٧٨٩'
const easternArabicIndic = '۰۱۲۳۴۵۶۷۸۹'
const convertDigits = value => String(value).replace(/[٠-٩۰-۹]/g, ch => {
  const i = arabicIndic.indexOf(ch)
  if (i >= 0) return String(i)
  const j = easternArabicIndic.indexOf(ch)
  return j >= 0 ? String(j) : ch
})

export const normalizeVisibleDigits = root => {
  if (!root) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  let node
  while ((node = walker.nextNode())) nodes.push(node)
  nodes.forEach(textNode => {
    const parent = textNode.parentElement
    if (!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return
    const next = convertDigits(textNode.nodeValue)
    if (next !== textNode.nodeValue) textNode.nodeValue = next
  })
}

export { convertDigits }

