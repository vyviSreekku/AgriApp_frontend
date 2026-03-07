cmake_minimum_required(VERSION 3.22.1)
project("appmodules")

# React Native CMake setup
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Define path to llama.cpp (relative to this CMakeLists.txt in android/app/src/main/jni)
set(LLAMA_DIR_RELATIVE "../cpp/llama.cpp")
get_filename_component(LLAMA_DIR ${LLAMA_DIR_RELATIVE} ABSOLUTE)

# Enable common build in llama.cpp
set(LLAMA_BUILD_COMMON ON CACHE BOOL "" FORCE)

add_subdirectory(${LLAMA_DIR} llama_cpp_build)

set(GGML_DIR ${LLAMA_DIR}/ggml)
set(COMMON_DIR ${LLAMA_DIR}/common)
set(VENDOR_DIR ${LLAMA_DIR}/vendor)

# Add source files to the existing appmodules target created by RN
target_sources(${CMAKE_PROJECT_NAME} PRIVATE 
    ../cpp/llm_bridge.cpp
    ../cpp/LLMInference.cpp
)

# Apply include directories
target_include_directories(
        ${CMAKE_PROJECT_NAME}
        PUBLIC
        ${COMMON_DIR}
        ${GGML_DIR}/include
        ${GGML_DIR}/src
        ${GGML_DIR}/src/ggml-cpu
        ${LLAMA_DIR}/include
        ${VENDOR_DIR}
)

# Apply standard optimizations
target_compile_options(
        ${CMAKE_PROJECT_NAME}
        PUBLIC
        -fvisibility=hidden -fvisibility-inlines-hidden
        -ffunction-sections -fdata-sections
        -Wno-unused-function
)

target_link_options(
        ${CMAKE_PROJECT_NAME}
        PRIVATE
        -Wl,--gc-sections -flto
        -Wl,--exclude-libs,ALL
)

# Link dependencies
if(TARGET vulkan)
    set(EXTRA_LIBS vulkan)
endif()

target_link_libraries(
        ${CMAKE_PROJECT_NAME}
        android log llama common ${EXTRA_LIBS}
)

# Apply architecture-specific optimizations
if (${ANDROID_ABI} STREQUAL "arm64-v8a")
    set(GGML_SYSTEM_ARCH "ARM")
    set(GGML_CPU_KLEIDIAI ON)
    set(GGML_OPENMP ON)
    
    target_compile_definitions(${CMAKE_PROJECT_NAME} PRIVATE
            GGML_SYSTEM_ARCH=${GGML_SYSTEM_ARCH}
            GGML_CPU_KLEIDIAI=$<BOOL:${GGML_CPU_KLEIDIAI}>
            GGML_OPENMP=$<BOOL:${GGML_OPENMP}>
    )
    
    target_compile_options(
            ${CMAKE_PROJECT_NAME}
            PUBLIC
            -DGGML_USE_CPU -DGGML_USE_CPU_AARCH64 -march=armv8-a -O3
    )
else()
    # Universal fallback for other archs (like x86_64 emulator)
    target_compile_options(
            ${CMAKE_PROJECT_NAME}
            PUBLIC
            -DGGML_USE_CPU -O3
    )
endif()
