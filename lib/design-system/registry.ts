import { SafeButton } from "./components/SafeButton";
import { AdvancedButton } from "./components/AdvancedButton";
import { Card } from "./components/Card";
import { Surface } from "./components/Surface";
import { Background } from "./components/Background";
import { Icon } from "./components/Icon";
import * as Dialog from "./components/Dialog";
import * as Select from "./components/Select";
import * as Tabs from "./components/Tabs";
import { Checkbox } from "./components/Checkbox";
import { RadioGroup, RadioItem } from "./components/RadioGroup";
import { ScrollArea } from "./components/ScrollArea";
import * as HoverCard from "./components/HoverCard";
import { Label } from "./components/Label";

export const designSystemRegistry = {
  safe: {
    button: SafeButton,
    card: Card,
    surface: Surface,
    background: Background,
    icon: Icon,
    dialog: Dialog,
    select: Select,
    tabs: Tabs,
    checkbox: Checkbox,
    radioGroup: RadioGroup,
    radioItem: RadioItem,
    scrollArea: ScrollArea,
    hoverCard: HoverCard,
    label: Label,
  },
  advanced: {
    button: AdvancedButton,
    card: Card, // you can later swap to a more intense card variant
    surface: Surface,
    background: Background,
    icon: Icon,
    dialog: Dialog,
    select: Select,
    tabs: Tabs,
    checkbox: Checkbox,
    radioGroup: RadioGroup,
    radioItem: RadioItem,
    scrollArea: ScrollArea,
    hoverCard: HoverCard,
    label: Label,
  },
};

export type DesignSystemRegistry = typeof designSystemRegistry;

