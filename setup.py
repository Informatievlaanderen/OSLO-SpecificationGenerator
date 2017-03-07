try:
    from setuptools import setup, Command
except:
    from distutils.core import setup, Command
import os
import sys

import specgen

# set dependencies
with open('requirements.txt') as f:
    INSTALL_REQUIRES = f.read().splitlines()

KEYWORDS = [
    'vocabulary',
    'specification',
    'linked data'
]

DESCRIPTION = '''
This tool generates HTML specification based on RDF input
'''

try:
    import pypandoc
    LONG_DESCRIPTION = pypandoc.convert('README.md', 'rst')
except(IOError, ImportError):
    with open('README.md') as f:
        LONG_DESCRIPTION = f.read()

CONTACT = 'Informatie Vlaanderen'

EMAIL = 'oslo@kb.vlaanderen.be'

SCRIPTS = [
    os.path.join('bin', 'generate_vocabulary.py')
]

URL = 'https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator'

if os.path.isfile('MANIFEST'):
    os.unlink('MANIFEST')


class PyTest(Command):
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import subprocess
        errno = subprocess.call([sys.executable, 'tests/run_tests.py'])
        raise SystemExit(errno)


# from https://wiki.python.org/moin/Distutils/Cookbook/AutoPackageDiscovery
def is_package(path):

    """decipher whether path is a Python package"""

    return (
        os.path.isdir(path) and
        os.path.isfile(os.path.join(path, '__init__.py'))
        )


def find_packages(path, base=''):
    """Find all packages in path"""

    packages = {}
    for item in os.listdir(path):
        dirpath = os.path.join(path, item)
        if is_package(dirpath):
            if base:
                module_name = "%(base)s.%(item)s" % vars()
            else:
                module_name = item
            packages[module_name] = dirpath
            packages.update(find_packages(dirpath, module_name))
    return packages


def find_packages_templates(location='.'):
    """get dirs to be specified as package_data keys (templates)"""

    # packages = []
    # for root, dirs, files in os.walk(location):
    #     if 'templates' in dirs:  # include as a package_data key
    #         packages.append(root.replace(os.sep, '.').replace('..', ''))
    #
    #     if 'transformations' in dirs:  # include as a package_data key
    #         packages.append(root.replace(os.sep, '.').replace('..', ''))
    # return packages

    return {'specgen': ['templates/*/*.j2'
                          ]}

setup(
    name='specgen',
    version=specgen.__version__,
    description=DESCRIPTION.strip(),
    long_description=LONG_DESCRIPTION,
    platforms='all',
    keywords=' '.join(KEYWORDS),
    author=CONTACT,
    author_email=EMAIL,
    maintainer=CONTACT,
    maintainer_email=EMAIL,
    url=URL,
    install_requires=INSTALL_REQUIRES,
    packages=find_packages('.').keys(),
    package_data=find_packages_templates('specgen'),
    scripts=SCRIPTS,
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'Operating System :: OS Independent',
        'Programming Language :: Python'
    ]
)
