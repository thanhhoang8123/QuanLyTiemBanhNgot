const vietnameseMobilePattern = /^0(?:32|33|34|35|36|37|38|39|52|56|58|59|70|76|77|78|79|81|82|83|84|85|86|88|89|90|91|92|93|94|96|97|98|99)\d{7}$/

export function normalizeVietnamesePhone(value) {
  if (typeof value !== 'string') return null

  const compact = value.trim().replace(/[\s().-]/g, '')
  const national = compact.startsWith('+84')
    ? `0${compact.slice(3)}`
    : compact.startsWith('84')
      ? `0${compact.slice(2)}`
      : compact

  return vietnameseMobilePattern.test(national) ? national : null
}

export function isValidVietnamesePhone(value) {
  return typeof value === 'string' && vietnameseMobilePattern.test(value)
}
