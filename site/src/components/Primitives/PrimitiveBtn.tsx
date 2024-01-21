import { ParentComponent } from "solid-js";
import { A } from "solid-start";

const PrimitiveBtn: ParentComponent<{ href: string }> = props => {
  return (
    <A
      href={`/package/${props.href}`}
      class="flex-shrink-0 rounded-md px-2 text-[14px] font-semibold text-[#063983] transition-colors hover:bg-[#d0e4ff87] hover:text-[#00275f] dark:text-[#d0dff2] dark:hover:bg-[#566e8e87] dark:hover:text-[#eff6ff] sm:text-base"
    >
      {props.children}
    </A>
  );
};

export default PrimitiveBtn;
