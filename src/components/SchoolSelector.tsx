import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { loadSchools } from "@/utils/schoolParser";

interface SchoolSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SchoolSelector({ value, onChange }: SchoolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchools().then((schoolList) => {
      setSchools(schoolList);
      setLoading(false);
    });
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select your school..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-background" align="start" style={{ zIndex: 9999 }}>
        <Command className="bg-background">
          <CommandInput placeholder="Search school..." className="h-9" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {loading ? "Loading schools..." : "No school found."}
            </CommandEmpty>
            <CommandGroup>
              {schools.map((school) => (
                <CommandItem
                  key={school}
                  value={school}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === school ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {school}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
