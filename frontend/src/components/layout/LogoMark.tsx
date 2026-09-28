import {
  BRAND_NAME,
  LOGO_MARK_SIZE_PX,
  LOGO_MARK_SRC,
  LOGO_MARK_TEXT_OVERLAP_PX,
} from "@/constants/brand";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt={BRAND_NAME}
      width={LOGO_MARK_SIZE_PX}
      height={LOGO_MARK_SIZE_PX}
      className={cn("shrink-0 object-contain", className)}
      style={{
        width: LOGO_MARK_SIZE_PX,
        height: LOGO_MARK_SIZE_PX,
        marginRight: -LOGO_MARK_TEXT_OVERLAP_PX,
      }}
      decoding="async"
    />
  );
}
