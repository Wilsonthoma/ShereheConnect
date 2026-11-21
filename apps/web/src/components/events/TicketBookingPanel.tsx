'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import type { BookingRecord } from '@/lib/bookingsApi';
import {
  calculateTierSubtotalKes,
  formatOccupantCount,
  getAvailableCount,
  getEffectivePricingMode,
  getOccupantsPerUnit,
  type AttendanceMode,
  type EventTicketTier,
  type SubgroupOption,
  type TranslateFn,
} from '@/lib/eventDetailHelpers';

interface TicketBookingPanelProps {
  tiers: EventTicketTier[];
  individualTiers: EventTicketTier[];
  groupTiers: EventTicketTier[];
  subgroupOptions: SubgroupOption[];
  selectedSubgroupKey: string;
  visibleTiers: EventTicketTier[];
  attendanceMode: AttendanceMode;
  selectedTier: EventTicketTier | null;
  quantity: number;
  maxSelectable: number;
  estimatedOccupants: number;
  totalKes: number;
  existingBooking: BookingRecord | null;
  submitting: boolean;
  bookingError: string | null;
  tr: TranslateFn;
  formatKes: (amount: number) => string;
  formatGroupCategoryLabel: (category?: string | null) => string;
  onSelectAttendanceMode: (mode: AttendanceMode) => void;
  onSelectSingleSubgroup: (option: SubgroupOption) => void;
  onSelectTierId: (tierId: string) => void;
  onChangeQuantity: (qty: number) => void;
  onClearBookingError: () => void;
  onSubmit: (e: FormEvent) => void;
}

export default function TicketBookingPanel({
  tiers,
  individualTiers,
  groupTiers,
  subgroupOptions,
  selectedSubgroupKey,
  visibleTiers,
  attendanceMode,
  selectedTier,
  quantity,
  maxSelectable,
  estimatedOccupants,
  totalKes,
  existingBooking,
  submitting,
  bookingError,
  tr,
  formatKes,
  formatGroupCategoryLabel,
  onSelectAttendanceMode,
  onSelectSingleSubgroup,
  onSelectTierId,
  onChangeQuantity,
  onClearBookingError,
  onSubmit,
}: TicketBookingPanelProps) {
  const canToggleToIndividual =
    individualTiers.length > 0 || groupTiers.length > 0;
  const canToggleToGroup = groupTiers.length > 0;

  return (
    <aside className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 h-fit space-y-5 text-left">
      <div className="space-y-1">
        <h2
          data-subheading="true"
          className="subheading text-lg text-slate-900 dark:text-white"
        >
          {tr('evt.detail.selectHeading')}
        </h2>
        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
          {tr('evt.detail.selectHelper')}
        </p>
      </div>

      {existingBooking && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <p className="font-normal">
            {tr('evt.detail.existingBookingNotice', {
              ref: existingBooking.bookingReference,
            })}
          </p>
          <p className="text-[11px] font-normal opacity-90">
            {tr('evt.detail.oneBookingPerEvent')}
          </p>
          <Link
            href="/tickets"
            className="inline-block underline text-[#1A8CC4] dark:text-[#29ABE2]"
          >
            {tr('evt.detail.viewTickets')}
          </Link>
        </div>
      )}

      {tiers.length === 0 ? (
        <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
          {tr('evt.detail.noTiers')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <span
              data-subheading="true"
              className="subheading block text-xs text-slate-700 dark:text-slate-200"
            >
              {tr('evt.detail.attendanceModeLabel')}
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-[#2B2B2B] p-1 border border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant={attendanceMode === 'INDIVIDUAL' ? 'secondary' : 'ghost'}
                size="sm"
                disabled={!canToggleToIndividual}
                onClick={() => onSelectAttendanceMode('INDIVIDUAL')}
                className={`rounded-lg py-2 px-3 text-xs ${
                  attendanceMode === 'INDIVIDUAL'
                    ? 'bg-white dark:bg-[#3A3A3A] text-[#1A8CC4] dark:text-[#29ABE2] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tr('evt.detail.modeIndividual', {
                  count: individualTiers.length,
                })}
              </Button>
              <Button
                type="button"
                variant={attendanceMode === 'GROUP' ? 'secondary' : 'ghost'}
                size="sm"
                disabled={!canToggleToGroup}
                onClick={() => onSelectAttendanceMode('GROUP')}
                className={`rounded-lg py-2 px-3 text-xs ${
                  attendanceMode === 'GROUP'
                    ? 'bg-white dark:bg-[#3A3A3A] text-[#1A8CC4] dark:text-[#29ABE2] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tr('evt.detail.modeGroup', {
                  count: groupTiers.length,
                })}
              </Button>
            </div>
          </div>

          {attendanceMode === 'GROUP' && subgroupOptions.length > 0 && (
            <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#2B2B2B]/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  data-subheading="true"
                  className="subheading text-xs text-slate-700 dark:text-slate-200"
                >
                  {tr('evt.detail.selectSubgroup')}
                </span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {subgroupOptions.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {subgroupOptions.map((option) => {
                  const isChosen = selectedSubgroupKey === option.key;
                  const optionDisabled =
                    !option.isActive || option.availableCount <= 0;

                  return (
                    <Button
                      key={option.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={optionDisabled}
                      onClick={() => onSelectSingleSubgroup(option)}
                      className={`w-full justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                        isChosen
                          ? 'border-[#29ABE2] bg-[#E0F2FE] dark:bg-[#29ABE2]/20 text-[#1A8CC4] dark:text-[#29ABE2]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className="font-normal truncate">
                        {option.label}
                      </span>
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                        {formatOccupantCount(option.occupantsPerUnit, tr)}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <span
              data-subheading="true"
              className="subheading block text-xs text-slate-700 dark:text-slate-200"
            >
              {attendanceMode === 'GROUP'
                ? tr('evt.detail.groupPackageLabel')
                : tr('evt.detail.individualPackageLabel')}
            </span>

            {visibleTiers.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] p-3 text-xs font-normal text-slate-500 dark:text-slate-400 space-y-2">
                <p>{tr('evt.detail.emptySelection')}</p>
                {attendanceMode === 'INDIVIDUAL' && groupTiers.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectAttendanceMode('GROUP')}
                    className="px-0 text-xs text-[#1A8CC4] dark:text-[#29ABE2] underline"
                  >
                    {tr('evt.detail.switchToGroup')}
                  </Button>
                )}
              </div>
            ) : (
              visibleTiers.map((tier) => {
                const available = getAvailableCount(tier);
                const disabled = tier.isActive === false || available <= 0;
                const isSelected = tier.id === selectedTier?.id;
                const occupantsPerUnit = getOccupantsPerUnit(tier);
                const pricingMode = getEffectivePricingMode(tier);
                const samplePrice = calculateTierSubtotalKes(tier, 1);

                return (
                  <button
                    key={tier.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onSelectTierId(tier.id);
                      onClearBookingError();
                    }}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-[#29ABE2] bg-[#E0F2FE]/70 dark:bg-[#29ABE2]/15'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B2B2B]'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-normal text-slate-900 dark:text-white block">
                          {tier.name}
                        </span>
                        {tier.isGroupSubgroup && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded-md bg-[#E0F2FE] dark:bg-[#29ABE2]/20 px-2 py-0.5 text-[11px] font-normal text-[#1A8CC4] dark:text-[#29ABE2]">
                              {formatGroupCategoryLabel(tier.groupCategory)}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-[#3A3A3A] px-2 py-0.5 text-[11px] font-normal text-slate-700 dark:text-slate-200">
                              {tr('evt.detail.occupantsPerUnit', {
                                count: occupantsPerUnit,
                                label:
                                  occupantsPerUnit === 1
                                    ? tr('common.occupant.singular')
                                    : tr('common.occupant.plural'),
                              })}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-[#3A3A3A] px-2 py-0.5 text-[11px] font-normal text-slate-600 dark:text-slate-300">
                              {pricingMode === 'BUNDLE_FIXED'
                                ? tr('common.pricing.fixedBundle')
                                : tr('common.pricing.perOccupant')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-normal text-[#1A8CC4] dark:text-[#29ABE2] block">
                          {formatKes(samplePrice)}
                        </span>
                        {tier.isGroupSubgroup &&
                          pricingMode === 'PER_OCCUPANT' &&
                          tier.priceKes > 0 && (
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                              {tr('evt.detail.perOccupantRate', {
                                amount: formatKes(tier.priceKes),
                              })}
                            </span>
                          )}
                      </div>
                    </div>

                    {tier.description && (
                      <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-1.5">
                        {tier.description}
                      </p>
                    )}
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1.5">
                      {available > 0
                        ? tr('evt.detail.remainingUnits', {
                            count: available,
                            unitLabel: tier.isGroupSubgroup
                              ? available === 1
                                ? tr('common.unit.singular')
                                : tr('common.unit.plural')
                              : available === 1
                                ? tr('common.ticket.singular')
                                : tr('common.ticket.plural'),
                          })
                        : tr('evt.detail.soldOut')}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {selectedTier && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="ticket-qty"
                    data-subheading="true"
                    className="subheading text-xs text-slate-700 dark:text-slate-200"
                  >
                    {selectedTier.isGroupSubgroup
                      ? tr('evt.detail.groupUnitsLabel')
                      : tr('evt.detail.ticketQtyLabel')}
                  </label>
                  <input
                    id="ticket-qty"
                    type="number"
                    min={1}
                    max={maxSelectable}
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      onChangeQuantity(
                        Math.min(maxSelectable, Math.max(1, val)),
                      );
                    }}
                    className="w-24 rounded-lg border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#2B2B2B] px-3 py-2 text-sm font-normal text-right text-slate-900 dark:text-white outline-none focus:border-[#29ABE2]"
                  />
                </div>
                <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {selectedTier.isGroupSubgroup
                    ? tr('evt.detail.groupQtyHelper', {
                        perUnit: getOccupantsPerUnit(selectedTier),
                        qty: quantity,
                        total: estimatedOccupants,
                      })
                    : tr('evt.detail.standardQtyHelper', {
                        max: maxSelectable,
                      })}
                </p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5">
                {selectedTier.isGroupSubgroup && (
                  <div className="flex items-center justify-between text-xs font-normal text-slate-600 dark:text-slate-300">
                    <span>{tr('evt.detail.estOccupants')}</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatOccupantCount(estimatedOccupants, tr)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-slate-600 dark:text-slate-300">
                    {tr('evt.detail.totalAmount')}
                  </span>
                  <span className="text-base font-normal text-slate-900 dark:text-white">
                    {formatKes(totalKes)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={submitting}
                disabled={
                  submitting ||
                  Boolean(existingBooking) ||
                  selectedTier.isActive === false ||
                  getAvailableCount(selectedTier) <= 0
                }
                className="btn-coddy w-full text-sm disabled:opacity-50"
              >
                {existingBooking
                  ? tr('evt.detail.alreadyBooked')
                  : submitting
                    ? tr('evt.detail.processing')
                    : totalKes === 0
                      ? tr('evt.detail.claimFree')
                      : tr('evt.detail.reserveTickets')}
              </Button>
            </>
          )}

          {bookingError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-normal text-red-600 dark:text-red-400">
              {bookingError}
            </div>
          )}
        </form>
      )}
    </aside>
  );
}