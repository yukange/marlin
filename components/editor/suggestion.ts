import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";

import { SuggestionList } from "./suggestion-list";

import type { SuggestionListRef } from "./suggestion-list";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type { Instance as TippyInstance } from "tippy.js";

export const getSuggestionOptions = (
  space: string
): Omit<SuggestionOptions, "editor"> => ({
  char: "#",
  items: async ({ query }) => {
    try {
      const { getAllTags } = await import("@/lib/services/note-service");
      const tags = await getAllTags(space);
      return tags.filter((tag) =>
        tag.toLowerCase().includes(query.toLowerCase())
      );
    } catch (e) {
      console.error("Failed to load tags", e);
      return [];
    }
  },

  render: () => {
    let component: ReactRenderer<SuggestionListRef> | undefined;
    let popup: TippyInstance[] | undefined;
    let isDestroyed = false;

    return {
      onStart: (props) => {
        isDestroyed = false;
        component = new ReactRenderer(SuggestionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tippy.js type mismatch
          getReferenceClientRect: props.clientRect as any,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate(props) {
        // Defer update to avoid conflict with React render cycle (flushSync error)
        requestAnimationFrame(() => {
          if (isDestroyed || !component) {
            return;
          }

          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          if (popup?.[0]) {
            popup[0].setProps({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tippy.js type mismatch
              getReferenceClientRect: props.clientRect as any,
            });
          }
        });
      },

      onKeyDown(props) {
        if (props.event.key === "Escape") {
          if (popup?.[0]) {
            popup[0].hide();
          }
          return true;
        }

        return component?.ref?.onKeyDown(props) || false;
      },

      onExit() {
        isDestroyed = true;
        if (popup?.[0]) {
          popup[0].destroy();
        }
        component?.destroy();
        popup = undefined;
        component = undefined;
      },
    };
  },
});
