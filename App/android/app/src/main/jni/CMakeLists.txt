cmake_minimum_required(VERSION 3.22.1)
project("appmodules")

set(AUTOLINKING_CMAKE_FILE "${CMAKE_CURRENT_LIST_DIR}/../../../build/generated/autolinking/src/main/jni/Android-autolinking.cmake")
set(AUTOLINKING_STUB_ROOT "${PROJECT_BUILD_DIR}/generated/autolinking/stubs")

function(patch_autolinking_codegen_sources autolinking_cmake_file stub_root)
        if(NOT EXISTS "${autolinking_cmake_file}")
                return()
        endif()

        file(STRINGS "${autolinking_cmake_file}" autolinking_lines)

        set(autolink_libs "")
        set(reading_libs FALSE)
        set(subdir_index 0)
        set(original_lines "")
        set(replacement_lines "")

        foreach(line IN LISTS autolinking_lines)
                if(line MATCHES "^set\\(AUTOLINKED_LIBRARIES")
                        set(reading_libs TRUE)
                        continue()
                endif()

                if(reading_libs)
                        if(line MATCHES "^\\)")
                                set(reading_libs FALSE)
                                continue()
                        endif()

                        string(STRIP "${line}" stripped_line)
                        if(stripped_line STREQUAL "")
                                continue()
                        endif()

                        list(APPEND autolink_libs "${stripped_line}")
                endif()
        endforeach()

        list(LENGTH autolink_libs autolink_lib_count)

        foreach(line IN LISTS autolinking_lines)
                if(NOT line MATCHES "add_subdirectory\\(\"([^\"]+)\"[ \\t]+([^)]+)\\)")
                        continue()
                endif()

                set(autolink_dir "${CMAKE_MATCH_1}")
                set(autolink_build_dir "${CMAKE_MATCH_2}")
                string(STRIP "${autolink_build_dir}" autolink_build_dir)
                set(replacement_path "")

                if(subdir_index LESS autolink_lib_count)
                        list(GET autolink_libs ${subdir_index} autolink_lib)
                else()
                        set(autolink_lib "")
                endif()
                math(EXPR subdir_index "${subdir_index} + 1")

                if(EXISTS "${autolink_dir}")
                        file(TO_CMAKE_PATH "${autolink_dir}" autolink_dir_cmake)
                        if(NOT autolink_dir STREQUAL autolink_dir_cmake)
                                set(replacement_path "${autolink_dir_cmake}")
                        endif()
                else()
                        if(autolink_lib STREQUAL "")
                                continue()
                        endif()

                        set(stub_dir "${stub_root}/${autolink_build_dir}")
                        file(TO_CMAKE_PATH "${stub_dir}" stub_dir_cmake)
                        file(MAKE_DIRECTORY "${stub_dir}")

                        set(stub_cmake_file "${stub_dir}/CMakeLists.txt")
                        set(stub_source_file "${stub_dir}/autolinking_stub.cpp")
                        file(WRITE "${stub_source_file}" "void ${autolink_lib}_autolink_stub() {}\n")
                        file(WRITE "${stub_cmake_file}" "cmake_minimum_required(VERSION 3.13)\n# copilot-autolink-stub\nadd_library(${autolink_lib} STATIC autolinking_stub.cpp)\nset_target_properties(${autolink_lib} PROPERTIES POSITION_INDEPENDENT_CODE ON)\n")
                        set(replacement_path "${stub_dir_cmake}")
                endif()

                if(replacement_path STREQUAL "")
                        continue()
                endif()

                list(APPEND original_lines "${line}")
                list(APPEND replacement_lines "add_subdirectory(\"${replacement_path}\" ${autolink_build_dir})")
        endforeach()

        list(LENGTH original_lines replacement_count)
        if(replacement_count EQUAL 0)
                return()
        endif()

        file(READ "${autolinking_cmake_file}" autolinking_contents)
        math(EXPR replacement_last_index "${replacement_count} - 1")
        foreach(index RANGE ${replacement_last_index})
                list(GET original_lines ${index} original_line)
                list(GET replacement_lines ${index} replacement_line)
                string(REPLACE "${original_line}" "${replacement_line}" autolinking_contents "${autolinking_contents}")
        endforeach()
        file(WRITE "${autolinking_cmake_file}" "${autolinking_contents}")
endfunction()

patch_autolinking_codegen_sources("${AUTOLINKING_CMAKE_FILE}" "${AUTOLINKING_STUB_ROOT}")

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
