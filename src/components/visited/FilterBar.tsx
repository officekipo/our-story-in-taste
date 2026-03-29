'use client';
import { SIDO, CUISINES, SORT } from '@/types';
import { cn } from '@/lib/utils/cn';
interface FilterBarProps {
    sido: string;
    cuisine: string;
    sort: string;
    timeline: boolean;
    search: string;
    showSearch: boolean;
    onSido: (v: string) => void;
    onCuisine: (v: string) => void;
    onSort: (v: string) => void;
    onTimeline: () => void;
    onSearch: (v: string) => void;
    onToggleSearch: () => void;
}
const chip = 'px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 cursor - pointer';
const active = 'bg-rose text-white border-rose';
const inactive = 'bg-white text-muted border-muted-light';
export function FilterBar(props: FilterBarProps) {
    const { sido, cuisine, sort, timeline, showSearch, search } = props;
    return (
        <div>
            <div className="flex gap-2 px-0 py-2.5 overflow-x-auto items-center">
                {/* 지역 셀렉트 */}
                <div className="relative shrink-0">
                    <select value={sido} onChange={(e) => props.onSido(e.target.value)}
                        className={cn(chip, 'pr-6', sido ? active : inactive)}>
                        <option value="">지역 전체</option>
                        {SIDO.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none">▾</span>
                </div>
                {/* 음식 셀렉트 */}
                <div className="relative shrink-0">
                    <select value={cuisine} onChange={(e) =>
                        props.onCuisine(e.target.value)}
                        className={cn(chip, 'pr-6', cuisine ? active : inactive)}>
                        <option value="">음식 전체</option>
                        {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none">▾</span>
                </div>
                {/* 정렬 */}
                {SORT.map((o) => (
                    <button key={o.v} onClick={() => props.onSort(o.v)}
                        className={cn(chip, sort === o.v ? active :
                            inactive)}>{o.l}</button>
                ))}
                <button onClick={props.onTimeline} className={cn(chip, timeline ?
                    active : inactive)}> 타임라인</button>
                <button onClick={props.onToggleSearch} className={cn(chip, showSearch ?
                    'bg-rose-light text-rose border-rose' : inactive, 'ml-auto')}> </button>
            </div>
            {showSearch && (
                <div className="pb-2.5">
                    <input value={search} onChange={(e) =>
                        props.onSearch(e.target.value)}
                        placeholder="식당, 지역, 추억 검색..." autoFocus
                        className="w-full px-4 py-2.5 bg-white border border-muted-light rounded-xl text-sm text-ink" />
                </div>
            )}
        </div>
    );
}
