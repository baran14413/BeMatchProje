
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
      thumbClassName?: string;
      trackClassName?: string;
      rangeClassName?: string;
      onCommit?: (value: number[]) => void;
  }
>(({ className, thumbClassName, trackClassName, rangeClassName, onCommit, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    onValueCommit={onCommit}
    {...props}
  >
    <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", trackClassName)}>
      <SliderPrimitive.Range className={cn("absolute h-full bg-primary", rangeClassName)} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={cn("block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", thumbClassName)} />
     {/* Add a second thumb if the value is an array with two numbers for range sliders */}
    {Array.isArray(props.value) && props.value.length === 2 && (
      <SliderPrimitive.Thumb className={cn("block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", thumbClassName)} />
    )}
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
