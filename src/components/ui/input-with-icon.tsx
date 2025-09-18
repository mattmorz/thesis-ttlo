import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangleIcon } from "lucide-react";
import { InputHTMLAttributes } from "react";

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon: React.ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
}

export default function InputWithIcon({
  label,
  icon,
  wrapperClassName = "",
  inputClassName = "",
  ...inputProps
}: IconInputProps) {
  return (
    <div className={`*:not-first:mt-2 ${wrapperClassName}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input className={`peer ps-9 ${inputClassName}`} {...inputProps} />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
          {icon || <AlertTriangleIcon size={16} aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
