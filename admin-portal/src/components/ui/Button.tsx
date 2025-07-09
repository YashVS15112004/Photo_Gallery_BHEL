import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { Tooltip } from './Tooltip'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', tooltip, ...props }, ref) => {
    const btn = (
      <button
        className={cn(
          'btn',
          {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
            'btn-danger': variant === 'danger',
            'border border-gray-300 bg-surface dark:bg-surface-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700': variant === 'outline',
            'btn-sm': size === 'sm',
            'btn-md': size === 'md',
            'btn-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
    return tooltip ? <Tooltip title={tooltip}>{btn}</Tooltip> : btn
  }
)
Button.displayName = 'Button'

export { Button } 