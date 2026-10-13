import { useEffect, useRef, useState } from "react"

export function useInView<ElementType extends Element>(threshold = 0.35) {
  const elementRef = useRef<ElementType | null>(null)
  const [isInView, setIsInView] = useState(
    () => typeof IntersectionObserver === "undefined"
  )

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsInView(true)
        observer.disconnect()
      },
      { threshold }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])

  return { elementRef, isInView }
}
