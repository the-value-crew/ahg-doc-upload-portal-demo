import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiMail, FiCopy, FiCheck, FiChevronDown } from "react-icons/fi";
import {
    CONTACT_PERSONS,
    getContactByIdOrEmail,
    ContactPerson,
} from "../config/contacts.config";

interface NavbarContactProps {
    className?: string;
}

function NavbarContact({ className = "" }: NavbarContactProps) {
    const [searchParams] = useSearchParams();
    const repParam =
        searchParams.get("rep") ||
        searchParams.get("specialist") ||
        searchParams.get("contact");

    const [activeContact, setActiveContact] = useState<ContactPerson>(() =>
        getContactByIdOrEmail(repParam)
    );
    const [copied, setCopied] = useState<boolean>(false);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync with query parameter if present
    useEffect(() => {
        if (repParam) {
            setActiveContact(getContactByIdOrEmail(repParam));
        }
    }, [repParam]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setDropdownOpen(false);
        };
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [dropdownOpen]);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(activeContact.email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="flex items-center bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-full px-3 py-1.5 transition-colors text-xs">
                {/* Live status dot */}
                <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>

                {/* Label */}
                <span className="text-[#6B7280] hidden md:inline mr-1.5">
                    Contact:
                </span>

                {/* Direct Email link */}
                <a
                    href={`mailto:${activeContact.email}?subject=AHG%20Pay%20Merchant%20Vault%20Onboarding%20-%20Assistance`}
                    className="font-semibold text-[#1A1A1A] hover:text-[#000000] hover:underline flex items-center gap-1.5"
                    title={`Assigned Contact: ${activeContact.name} (${activeContact.email})`}
                >
                    <FiMail className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>{activeContact.email}</span>
                </a>

                {/* Quick copy email button */}
                <button
                    type="button"
                    onClick={handleCopy}
                    className="ml-2 pl-2 border-l border-gray-200 text-gray-400 hover:text-black transition-colors"
                    title={copied ? "Copied to clipboard!" : "Copy email address"}
                >
                    {copied ? (
                        <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                        <FiCopy className="w-3.5 h-3.5" />
                    )}
                </button>

                {/* Dropdown toggle (if multiple contacts exist) */}
                {CONTACT_PERSONS.length > 1 && (
                    <button
                        type="button"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="ml-1 pl-1 text-gray-400 hover:text-black transition-colors"
                        title="View other assigned contacts"
                        aria-expanded={dropdownOpen}
                    >
                        <FiChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-150 ${dropdownOpen ? "rotate-180 text-black" : ""
                                }`}
                        />
                    </button>
                )}
            </div>

            {/* Minimalist Dropdown Menu for Contacts */}
            {dropdownOpen && CONTACT_PERSONS.length > 1 && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-gray-100">
                        Assigned Team Contacts
                    </div>
                    <div className="py-1">
                        {CONTACT_PERSONS.map((person) => {
                            const isSelected = person.id === activeContact.id;
                            return (
                                <button
                                    key={person.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveContact(person);
                                        setDropdownOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-gray-50 transition-colors ${isSelected ? "bg-[#02F1DE]/10 font-bold" : ""
                                        }`}
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="text-[#1A1A1A] truncate">{person.name}</div>
                                        <div className="text-[11px] text-gray-500 truncate">
                                            {person.email}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <FiCheck className="w-3.5 h-3.5 text-black flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NavbarContact;

