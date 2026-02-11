# Level 2 Problems: Interview-Style

These problems require choosing the right concurrency approach. Focus on:
1. Identifying the type of work (I/O-bound vs CPU-bound)
2. Selecting the appropriate library/pattern
3. Handling edge cases (errors, timeouts, coordination)

---

## 2.1 Rate-Limited API Fetcher

You have a list of 100 URLs to fetch, but the API allows only 5 concurrent requests. Fetch all URLs and return results.

**Requirements:**
- Maximum 5 concurrent requests at any time
- Return results in original order
- If a fetch fails, include `None` for that URL

```python
def fetch_all_rate_limited(urls: list[str]) -> list[str | None]:
    pass
```

**Think about:** Which library? How to limit concurrency? How to preserve order?

---

## 2.2 Parallel File Processor with Progress

Process a list of files in parallel. Each file takes variable time. Print progress updates showing completed/total.

**Requirements:**
- Process files in parallel (4 workers)
- Print "Completed X/Y" after each file finishes
- Return list of results

```python
def process_files_with_progress(filepaths: list[str]) -> list[str]:
    pass
```

**Think about:** How to track progress thread-safely? Which pattern shows results as they complete?

---

## 2.3 Timeout with Fallback

Call a primary service. If it doesn't respond within 2 seconds, call a backup service instead.

**Requirements:**
- Try primary service first (timeout 2s)
- If timeout, try backup service (timeout 5s)
- If both fail, raise an exception

```python
def call_with_fallback() -> str:
    pass
```

**Think about:** How to handle timeouts in your chosen approach?

---

## 2.4 Batch Processor with Error Collection

Process items in parallel. Some will fail. Collect all results and all errors separately.

**Requirements:**
- Process all items (don't stop on first error)
- Return (successful_results, errors) tuple
- Errors should include which item failed

```python
def process_batch(items: list[str]) -> tuple[list[str], list[tuple[str, Exception]]]:
    pass
```

**Think about:** How to handle exceptions in futures?

---

## 2.5 Producer-Consumer with Multiple Workers

Implement a job queue where:
- 1 producer adds jobs to a queue
- N consumers process jobs concurrently
- System shuts down gracefully when producer is done

**Requirements:**
- Producer adds 20 jobs
- 4 consumer workers
- All consumers exit cleanly when done

```python
def producer_consumer_system(n_workers: int) -> list[str]:
    pass
```

**Think about:** How to signal workers to stop? How to collect results?

---

## 2.6 Parallel Aggregation

Compute statistics over a large dataset split into chunks. Each chunk is processed in parallel, then results are combined.

**Requirements:**
- Split data into chunks
- Process each chunk in parallel (CPU-bound work)
- Combine chunk results into final result

```python
def parallel_sum_and_count(numbers: list[int], n_chunks: int) -> tuple[int, int]:
    # Return (total_sum, count)
    pass
```

**Think about:** Thread or process pool? How to split and combine?

---

## 2.7 Async Web Scraper

Scrape multiple pages where each page contains links to sub-pages. Fetch main pages concurrently, then fetch all sub-pages concurrently.

**Requirements:**
- Fetch N main pages concurrently
- Each main page returns list of sub-page URLs
- Fetch all sub-pages concurrently (limit: 10 at a time)
- Return all content

```python
async def scrape_site(main_urls: list[str]) -> dict[str, list[str]]:
    # Return {main_url: [sub_page_contents]}
    pass
```

**Think about:** Two levels of concurrency. How to manage the limit on the second level?

---

## 2.8 Graceful Shutdown

Long-running workers that should finish their current task before exiting when interrupted.

**Requirements:**
- Workers process items from a queue
- On shutdown signal, workers complete current item then exit
- No items should be left half-processed

```python
def run_with_graceful_shutdown():
    pass
```

**Think about:** How to signal shutdown? How to ensure current work completes?

---

## 2.9 Dependency-Ordered Execution

Tasks have dependencies on other tasks. Execute with maximum parallelism while respecting dependencies.

```python
# Task "C" depends on "A" and "B" completing first
dependencies = {
    "A": [],
    "B": [],
    "C": ["A", "B"],
    "D": ["B"],
    "E": ["C", "D"],
}

def execute_with_dependencies(deps: dict[str, list[str]]) -> list[str]:
    # Return list of task names in completion order
    pass
```

**Think about:** How to track which tasks are ready? When to check for newly-unblocked tasks?

---

## 2.10 Retry with Backoff

Fetch URLs with retry logic. On failure, wait increasingly longer before retrying.

**Requirements:**
- Max 3 retries per URL
- Backoff: 1s, 2s, 4s between retries
- Fetch all URLs concurrently
- Return results (None for URLs that failed all retries)

```python
def fetch_with_retry(urls: list[str]) -> list[str | None]:
    pass
```

**Think about:** How to implement retry within concurrent execution?

---

## Completion Checklist

- [ ] 2.1 Rate-Limited API Fetcher
- [ ] 2.2 Parallel File Processor with Progress
- [ ] 2.3 Timeout with Fallback
- [ ] 2.4 Batch Processor with Error Collection
- [ ] 2.5 Producer-Consumer with Multiple Workers
- [ ] 2.6 Parallel Aggregation
- [ ] 2.7 Async Web Scraper
- [ ] 2.8 Graceful Shutdown
- [ ] 2.9 Dependency-Ordered Execution
- [ ] 2.10 Retry with Backoff
