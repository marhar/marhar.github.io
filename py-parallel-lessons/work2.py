from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
from concurrent.futures import ProcessPoolExecutor
from threading import Lock
import time
import random
import math
import asyncio

# ----------------------------------------------------------------------------
# 2.1 Rate-Limited API Fetcher
# You have a list of 100 URLs to fetch, but the API allows only 5
# concurrent requests. Fetch all URLs and return results.
#
# Requirements:
# Maximum 5 concurrent requests at any time
# Return results in original order
# If a fetch fails, include None for that URL

def erroring_fetch(s):
    if random.random() < .2:
        raise TimeoutError
    return f"results from {s}"

def fetch1(s):
    try:
        return erroring_fetch(s)
    except TimeoutError:
        return None

def fetch_all_rate_limited(urls: list[str]) -> list[str | None]:
    with ThreadPoolExecutor(max_workers=5) as executor:
        return list(executor.map(fetch1, urls))

def m_2_1():
    results = fetch_all_rate_limited([str(x) for x in range(10)])
    print(results)

# ----------------------------------------------------------------------------
# 2.2 Parallel File Processor with Progress
# Process a list of files in parallel. Each file takes variable time.
# Print progress updates showing completed/total.
#
# Requirements:
#
# Process files in parallel (4 workers)
# Print "Completed X/Y" after each file finishes
# Return list of results
#
# Think about: How to track progress thread-safely? Which pattern
# shows results as they complete?

def copy(s):
    time.sleep(.5)
    return s,'OK'
    
def counting_copy(s):
    global m22_lock
    global m22_nfiles
    global m22_n
    with m22_lock:
        m22_n += 1
        print(f"Completed {m22_n}/{m22_nfiles}")
    return copy(s)

def process_files_with_progress(filepaths: list[str]) -> list[str]:
    global m22_nfiles
    global m22_n
    global m22_lock
    m22_nfiles = len(filepaths)
    m22_n = 0
    m22_lock = Lock()
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        return list(executor.map(counting_copy, filepaths))

def m_2_2():
    results = process_files_with_progress([str(x) for x in range(10)])
    print(results)

# ----------------------------------------------------------------------------
# 2.3 Timeout with Fallback
# Call a primary service. If it doesn't respond within 2 seconds,
# call a backup service instead.
#
# Requirements:
#
# Try primary service first (timeout 2s)
# If timeout, try backup service (timeout 5s)
# If both fail, raise an exception
#
# Think about: How to handle timeouts in your chosen approach?
# async: don't forget await, f() creates a coroutine, not f.

def do_2_3(x1):
    t1, t2 = x1
    def service1():
        time.sleep(t1)
        return "s1"
    
    def service2():
        time.sleep(t2)
        return "s2"

    def call_with_fallback() -> str:
        with ThreadPoolExecutor() as executor:
            for service, timeout in (service1, 2),(service2, 5):
                try:
                    future = executor.submit(service)
                    return future.result(timeout=timeout)
                except TimeoutError:
                    continue
        return "timeout"
        
    result = call_with_fallback()
    print(result)

async def do_2_3async(t1, t2):

    async def service1():
        await asyncio.sleep(t1)
        return "s1"
    
    async def service2():
        await asyncio.sleep(t2)
        return "s2"

    async def call_with_fallback() -> str:
        for service, timeout in [(service1, 2),(service2, 5)]:
            try:
                task = asyncio.create_task(service())
                return await asyncio.wait_for(task, timeout=timeout)
            except TimeoutError:
                continue
        return "timeout"
        
    result = await call_with_fallback()
    print(result)

def m_2_3():
    with ThreadPoolExecutor() as executor:
        futures = []
        for parm in [(1, 1), (3, 3), (8, 8)]:
            futures.append(executor.submit(do_2_3, parm))
        for future in as_completed(futures):
            _ = future.result()
    # do_2_3([1, 1]) # s1
    # do_2_3([3, 3]) # s2
    # do_2_3([8, 8]) # timeout

    async def run_all():
        await asyncio.gather(
            do_2_3async(1, 1),  # s1
            do_2_3async(3, 3),  # s2
            do_2_3async(8, 8),  # timeout
        )
    asyncio.run(run_all())
    # asyncio.run(do_2_3async(1, 1)) # s1
    # asyncio.run(do_2_3async(3, 3)) # s2
    # asyncio.run(do_2_3async(8, 8)) # timeout

# ----------------------------------------------------------------------------
# 2.4 Batch Processor with Error Collection
# Process items in parallel. Some will fail. Collect all results
# and all errors separately.
#
# Requirements:
#
# Process all items (don't stop on first error)
# Return (successful_results, errors) tuple
# Errors should include which item failed
# Think about: How to handle exceptions in futures?

def process_batch(items: list[str]) -> tuple[list[str], list[tuple[str, Exception]]]:
    
    def base_process(id):
        if random.random() < .5:
            raise ValueError
        return f"value-{id}"
        
    def process(id):
        try:
            return ("ok", base_process(id))
        except ValueError:
            return ("err", id)

    good = []
    bad = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        # return list(executor.map(process, items))
        futures = [executor.submit(process, item) for item in items]
        for future in as_completed(futures):
            status, result = future.result()
            if status == "ok":
                good.append(result)
            else:
                bad.append((status, result))
        return (good, bad)

def m_2_4():
    results = process_batch([str(x) for x in range(10)])
    print(results)

# ----------------------------------------------------------------------------
# 2.5 Producer-Consumer with Multiple Workers
# Implement a job queue where:
#
# 1 producer adds jobs to a queue
# N consumers process jobs concurrently
# System shuts down gracefully when producer is done
# Requirements:
#
# Producer adds 20 jobs
# 4 consumer workers
# All consumers exit cleanly when done


def producer_consumer_system(n_workers: int) -> list[str]:
    pass

def m_2_5():
    results = foozzz()
    print(results)


# Think about: How to signal workers to stop? How to collect results?

# ----------------------------------------------------------------------------
# 2.6 Parallel Aggregation
# Compute statistics over a large dataset split into chunks.
# Each chunk is processed in parallel, then results are combined.
#
# Requirements:
#
# Split data into chunks
# Process each chunk in parallel (CPU-bound work)
# Combine chunk results into final result


def parallel_sum_and_count(numbers: list[int], n_chunks: int) -> tuple[int, int]:
    # Return (total_sum, count)
    pass


def m_2_6():
    results = foozzz()
    print(results)

# Think about: Thread or process pool? How to split and combine?

# ----------------------------------------------------------------------------
# 2.7 Async Web Scraper
# Scrape multiple pages where each page contains links to sub-pages.
# Fetch main pages concurrently, then fetch all sub-pages concurrently.
#
# Requirements:
#
# Fetch N main pages concurrently
# Each main page returns list of sub-page URLs
# Fetch all sub-pages concurrently (limit: 10 at a time)
# Return all content


async def scrape_site(main_urls: list[str]) -> dict[str, list[str]]:
    # Return {main_url: [sub_page_contents]}
    pass

def m_2_7():
    results = foozzz()
    print(results)


# Think about: Two levels of concurrency. How to manage the limit on the second level?

# ----------------------------------------------------------------------------
# 2.8 Graceful Shutdown
# Long-running workers that should finish their current task before
# exiting when interrupted.
#
# Requirements:
#
# Workers process items from a queue
# On shutdown signal, workers complete current item then exit
# No items should be left half-processed


def run_with_graceful_shutdown():
    pass

def m_2_8():
    results = foozzz()
    print(results)


# Think about: How to signal shutdown? How to ensure current work completes?

# ----------------------------------------------------------------------------
# 2.9 Dependency-Ordered Execution
# Tasks have dependencies on other tasks. Execute with maximum
# parallelism while respecting dependencies.
#
# # Task "C" depends on "A" and "B" completing first
# dependencies = {
#     "A": [],
#     "B": [],
#     "C": ["A", "B"],
#     "D": ["B"],
#     "E": ["C", "D"],
# }
#
def execute_with_dependencies(deps: dict[str, list[str]]) -> list[str]:
    # Return list of task names in completion order
    pass

def m_2_9():
    results = foozzz()
    print(results)


# Think about: How to track which tasks are ready? When to check
# for newly-unblocked tasks?

# ----------------------------------------------------------------------------
# 2.10 Retry with Backoff
# Fetch URLs with retry logic. On failure, wait increasingly longer
# before retrying.
#
# Requirements:
#
# Max 3 retries per URL
# Backoff: 1s, 2s, 4s between retries
# Fetch all URLs concurrently
# Return results (None for URLs that failed all retries)
def fetch_with_retry(urls: list[str]) -> list[str | None]:
    pass

def m_2_10():
    results = foozzz()
    print(results)

# Think about: How to implement retry within concurrent execution?

# ----------------------------------------------------------------------------

if __name__ == "__main__":
    m_2_4()
    
