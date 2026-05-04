"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import React, { useState } from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export const InputGroupCopyButton = ({ onClick, ...props }: React.ComponentProps<"input"> & { onClick: () => void }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if(onClick) {
      onClick();
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <InputGroup className="w-full max-w-sm bg-background">
      <InputGroupInput {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Copy" onClick={handleCopy} size="icon-xs">
          {copied ? <CheckIcon /> : <CopyIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
